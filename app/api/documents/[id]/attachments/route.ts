import { NextRequest, NextResponse } from "next/server";
import { AttachmentKind, DocumentStatus, Role } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAuth, enforceBranchAccess, HttpError } from "@/lib/rbac";
import { saveUpload } from "@/lib/upload";
import { logAudit } from "@/lib/audit";
import { AuditAction, EntityType } from "@prisma/client";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth(request);
    if (session.role === Role.AUDITOR) {
      throw new HttpError(403, "Auditor is read-only");
    }

    const document = await db.document.findUnique({ where: { id: params.id } });
    if (!document) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    enforceBranchAccess(session, document.branchId, "write");
    if (document.status !== DocumentStatus.SUBMITTED) {
      return NextResponse.json({ message: "Attachments only allowed for SUBMITTED docs" }, { status: 400 });
    }

    const formData = await request.formData();
    const kind = formData.get("kind");
    const file = formData.get("file");

    if (!kind || typeof kind !== "string" || !file || !(file instanceof File)) {
      return NextResponse.json({ message: "Invalid upload" }, { status: 400 });
    }
    if (!Object.values(AttachmentKind).includes(kind as AttachmentKind)) {
      return NextResponse.json({ message: "Invalid attachment kind" }, { status: 400 });
    }

    const allowedTypes = ["application/pdf", "image/png", "image/jpeg"];
    const maxSizeBytes = 10 * 1024 * 1024;
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ message: "Only PDF, PNG, JPG files allowed" }, { status: 400 });
    }
    if (file.size > maxSizeBytes) {
      return NextResponse.json({ message: "File too large (max 10MB)" }, { status: 400 });
    }

    const upload = await saveUpload(file);
    const attachment = await db.attachment.create({
      data: {
        documentId: document.id,
        kind: kind as AttachmentKind,
        originalName: upload.originalName,
        storedName: upload.storedName,
        mimeType: upload.mimeType,
        sizeBytes: upload.sizeBytes,
        storagePath: upload.storagePath,
        uploadedByUserId: session.id,
      },
    });

    await logAudit({
      actorUserId: session.id,
      actorEmail: session.email,
      action: AuditAction.FILE_UPLOADED,
      entityType: EntityType.ATTACHMENT,
      entityId: attachment.id,
      branchId: document.branchId,
      detailsJson: {
        docId: document.id,
        docNo: document.docNo,
        kind: attachment.kind,
        originalName: attachment.originalName,
        sizeBytes: attachment.sizeBytes,
      },
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }
}
