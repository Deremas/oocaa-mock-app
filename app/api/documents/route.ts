import { NextRequest, NextResponse } from "next/server";
import { DocumentStatus, DocumentType, Role } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAuth, requireRole, HttpError } from "@/lib/rbac";
import { documentCreateSchema } from "@/lib/validators";
import { generateDocumentNo } from "@/lib/docNo";
import { logAudit } from "@/lib/audit";
import { AuditAction, EntityType } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const branchId = searchParams.get("branchId") ?? undefined;
    const dateFrom = searchParams.get("dateFrom") ?? undefined;
    const dateTo = searchParams.get("dateTo") ?? undefined;

    const where: Record<string, unknown> = {};
    if (q) {
      where.OR = [
        { docNo: { contains: q, mode: "insensitive" } },
        { candidateName: { contains: q, mode: "insensitive" } },
        { paymentReceiptNo: { contains: q, mode: "insensitive" } },
      ];
    }
    if (status) where.status = status;
    if (dateFrom || dateTo) {
      where.createdAt = {
        gte: dateFrom ? new Date(dateFrom) : undefined,
        lte: dateTo ? new Date(dateTo) : undefined,
      };
    }

    if (session.role === Role.BRANCH_ADMIN) {
      where.branchId = session.branchId ?? "missing";
    } else if (branchId) {
      where.branchId = branchId;
    }

    const documents = await db.document.findMany({
      where,
      include: {
        branch: true,
        createdBy: true,
        _count: { select: { attachments: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(documents);
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    requireRole(session, [Role.HQ_ADMIN, Role.BRANCH_ADMIN]);

    const body = documentCreateSchema.parse(await request.json());
    const branchId = session.role === Role.BRANCH_ADMIN ? session.branchId : body.branchId;
    if (!branchId) {
      throw new HttpError(400, "Branch is required");
    }

    const year = new Date().getFullYear();
    const docNo = await generateDocumentNo(branchId, year);

    const doc = await db.document.create({
      data: {
        docNo,
        type: DocumentType.ASSESSMENT_APPLICATION,
        status: DocumentStatus.SUBMITTED,
        branchId,
        candidateName: body.candidateName,
        candidateIdNumber: body.candidateIdNumber,
        phone: body.phone,
        occupation: body.occupation,
        level: body.level,
        paymentReceiptNo: body.paymentReceiptNo,
        paymentAmount: body.paymentAmount,
        paymentDate: body.paymentDate ? new Date(body.paymentDate) : null,
        paymentMethod: body.paymentMethod,
        createdByUserId: session.id,
      },
    });

    await db.documentVersion.create({
      data: {
        documentId: doc.id,
        versionNumber: 1,
        snapshotJson: JSON.parse(JSON.stringify(doc)),
        createdByUserId: session.id,
      },
    });

    await logAudit({
      actorUserId: session.id,
      actorEmail: session.email,
      action: AuditAction.DOCUMENT_CREATED,
      entityType: EntityType.DOCUMENT,
      entityId: doc.id,
      branchId: doc.branchId,
      detailsJson: { docNo: doc.docNo },
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }
}
