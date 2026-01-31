import { NextRequest, NextResponse } from "next/server";
import { DocumentStatus, Role } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAuth, enforceBranchAccess, HttpError } from "@/lib/rbac";
import { documentUpdateSchema } from "@/lib/validators";
import { logAudit } from "@/lib/audit";
import { AuditAction, EntityType } from "@prisma/client";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth(request);
    const document = await db.document.findUnique({
      where: { id: params.id },
      include: { branch: true, attachments: true, versions: true },
    });
    if (!document) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    enforceBranchAccess(session, document.branchId, "read");
    const auditLogs = await db.auditLog.findMany({
      where: {
        OR: [
          { entityId: document.id },
          { detailsJson: { path: ["docId"], equals: document.id } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ ...document, auditLogs });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth(request);
    const document = await db.document.findUnique({ where: { id: params.id } });
    if (!document) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    enforceBranchAccess(session, document.branchId, "write");
    if (document.status !== DocumentStatus.SUBMITTED) {
      return NextResponse.json({ message: "Only SUBMITTED docs can be edited" }, { status: 400 });
    }

    const body = documentUpdateSchema.parse(await request.json());
    const changedFields = Object.entries(body)
      .filter(([key, value]) => value !== undefined && (document as Record<string, unknown>)[key] !== value)
      .map(([key]) => key);
    const updated = await db.document.update({
      where: { id: document.id },
      data: {
        candidateName: body.candidateName,
        candidateIdNumber: body.candidateIdNumber,
        phone: body.phone,
        occupation: body.occupation,
        level: body.level,
        paymentReceiptNo: body.paymentReceiptNo,
        paymentAmount: body.paymentAmount,
        paymentDate: body.paymentDate ? new Date(body.paymentDate) : undefined,
        paymentMethod: body.paymentMethod,
      },
    });

    const latestVersion = await db.documentVersion.aggregate({
      where: { documentId: document.id },
      _max: { versionNumber: true },
    });
    const nextVersion = (latestVersion._max.versionNumber ?? 0) + 1;

    await db.documentVersion.create({
      data: {
        documentId: document.id,
        versionNumber: nextVersion,
        snapshotJson: JSON.parse(JSON.stringify(updated)),
        createdByUserId: session.id,
      },
    });

    await logAudit({
      actorUserId: session.id,
      actorEmail: session.email,
      action: AuditAction.DOCUMENT_UPDATED,
      entityType: EntityType.DOCUMENT,
      entityId: document.id,
      branchId: document.branchId,
      detailsJson: { docNo: updated.docNo, changedFields },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }
}
