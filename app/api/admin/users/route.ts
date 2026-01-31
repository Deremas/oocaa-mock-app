import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAuth, requireRole, HttpError } from "@/lib/rbac";
import { userCreateSchema } from "@/lib/validators";
import { logAudit } from "@/lib/audit";
import { AuditAction, EntityType } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    requireRole(session, [Role.HQ_ADMIN]);
    const users = await db.user.findMany({ include: { branch: true } });
    return NextResponse.json(users);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    requireRole(session, [Role.HQ_ADMIN]);
    const body = userCreateSchema.parse(await request.json());
    if (body.role === Role.BRANCH_ADMIN && !body.branchId) {
      return NextResponse.json({ message: "Branch is required for branch admins" }, { status: 400 });
    }
    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await db.user.create({
      data: {
        name: body.name,
        email: body.email,
        passwordHash,
        role: body.role,
        branchId: body.branchId ?? null,
      },
    });

    await logAudit({
      actorUserId: session.id,
      actorEmail: session.email,
      action: AuditAction.USER_CREATED,
      entityType: EntityType.USER,
      entityId: user.id,
      branchId: user.branchId,
      detailsJson: { email: user.email, role: user.role },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }
}
