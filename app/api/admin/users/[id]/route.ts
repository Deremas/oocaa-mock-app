import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAuth, requireRole, HttpError } from "@/lib/rbac";
import { userPatchSchema } from "@/lib/validators";
import { logAudit } from "@/lib/audit";
import { AuditAction, EntityType } from "@prisma/client";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth(request);
    requireRole(session, [Role.HQ_ADMIN]);

    const payload = await request.json();
    if (session.id === params.id && payload?.isActive === false) {
      return NextResponse.json({ message: "Cannot disable own HQ account" }, { status: 400 });
    }

    const body = userPatchSchema.parse(payload);

    const data: Record<string, unknown> = {};
    if (typeof body.isActive === "boolean") {
      data.isActive = body.isActive;
    }
    if (body.resetPassword) {
      data.passwordHash = await bcrypt.hash(body.resetPassword, 10);
    }
    if (body.name) data.name = body.name;
    if (body.email) data.email = body.email;
    if (body.role) data.role = body.role;
    if (body.branchId !== undefined) data.branchId = body.branchId;

    if (body.role === Role.BRANCH_ADMIN && !data.branchId) {
      return NextResponse.json({ message: "Branch is required for branch admins" }, { status: 400 });
    }

    const updated = await db.user.update({
      where: { id: params.id },
      data,
    });

    if (typeof body.isActive === "boolean") {
      await logAudit({
        actorUserId: session.id,
        actorEmail: session.email,
        action: body.isActive ? AuditAction.USER_ENABLED : AuditAction.USER_DISABLED,
        entityType: EntityType.USER,
        entityId: updated.id,
        branchId: updated.branchId,
        detailsJson: { isActive: body.isActive },
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

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth(request);
    requireRole(session, [Role.HQ_ADMIN]);

    if (session.id === params.id) {
      return NextResponse.json({ message: "Cannot delete own HQ account" }, { status: 400 });
    }

    const updated = await db.user.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    await logAudit({
      actorUserId: session.id,
      actorEmail: session.email,
      action: AuditAction.USER_DISABLED,
      entityType: EntityType.USER,
      entityId: updated.id,
      branchId: updated.branchId,
      detailsJson: { deleted: true },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }
}
