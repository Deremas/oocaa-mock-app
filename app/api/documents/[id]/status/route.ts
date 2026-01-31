import { NextRequest, NextResponse } from "next/server";
import { DocumentStatus, Role } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAuth, enforceBranchAccess, HttpError } from "@/lib/rbac";
import { statusUpdateSchema } from "@/lib/validators";
import { logAudit } from "@/lib/audit";
import { AuditAction, EntityType } from "@prisma/client";

function hasPayment(document: {
  paymentReceiptNo: string | null;
  paymentAmount: number | null;
  paymentDate: Date | null;
  paymentMethod: string | null;
}) {
  return Boolean(
    document.paymentReceiptNo &&
      document.paymentAmount &&
      document.paymentDate &&
      document.paymentMethod
  );
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth(request);
    const body = statusUpdateSchema.parse(await request.json());

    const document = await db.document.findUnique({
      where: { id: params.id },
      include: { attachments: true },
    });
    if (!document) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    enforceBranchAccess(session, document.branchId, "write");

    const wantsReviewed = body.nextStatus === DocumentStatus.REVIEWED;
    const wantsApproved = body.nextStatus === DocumentStatus.APPROVED;
    const wantsRejected = body.nextStatus === DocumentStatus.REJECTED;

    if (wantsReviewed) {
      if (session.role !== Role.BRANCH_ADMIN || document.status !== DocumentStatus.SUBMITTED) {
        throw new HttpError(403, "Not allowed");
      }
    }
    if (wantsApproved || wantsRejected) {
      if (session.role !== Role.HQ_ADMIN || document.status !== DocumentStatus.REVIEWED) {
        throw new HttpError(403, "Not allowed");
      }
    }

    if (wantsReviewed || wantsApproved) {
      const receiptAttachment = document.attachments.find((a) => a.kind === "PAYMENT_RECEIPT");
      if (!receiptAttachment || !hasPayment(document)) {
        return NextResponse.json(
          { message: "Payment metadata and receipt attachment required" },
          { status: 400 }
        );
      }
    }

    if (wantsRejected && !body.rejectReason) {
      return NextResponse.json({ message: "Reject reason required" }, { status: 400 });
    }

    const fromStatus = document.status;
    const updated = await db.document.update({
      where: { id: document.id },
      data: {
        status: body.nextStatus,
        reviewedByUserId: wantsReviewed ? session.id : document.reviewedByUserId,
        approvedByUserId: wantsApproved ? session.id : document.approvedByUserId,
        rejectReason: wantsRejected ? body.rejectReason : null,
      },
    });

    await logAudit({
      actorUserId: session.id,
      actorEmail: session.email,
      action: AuditAction.STATUS_CHANGED,
      entityType: EntityType.DOCUMENT,
      entityId: document.id,
      branchId: document.branchId,
      detailsJson: {
        docNo: document.docNo,
        fromStatus,
        toStatus: body.nextStatus,
      },
    });

    if (wantsRejected) {
      await logAudit({
        actorUserId: session.id,
        actorEmail: session.email,
        action: AuditAction.DOCUMENT_REJECTED,
        entityType: EntityType.DOCUMENT,
        entityId: document.id,
        branchId: document.branchId,
        detailsJson: { reason: body.rejectReason, docNo: document.docNo },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }
}
