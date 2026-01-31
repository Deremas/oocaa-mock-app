import { AuditAction, EntityType, Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export async function logAudit(params: {
  actorUserId?: string | null;
  actorEmail?: string | null;
  action: AuditAction;
  entityType: EntityType;
  entityId?: string | null;
  branchId?: string | null;
  detailsJson?: Prisma.InputJsonValue;
}) {
  return db.auditLog.create({
    data: {
      actorUserId: params.actorUserId ?? null,
      actorEmail: params.actorEmail ?? null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      branchId: params.branchId ?? null,
      detailsJson: params.detailsJson ?? {},
    },
  });
}
