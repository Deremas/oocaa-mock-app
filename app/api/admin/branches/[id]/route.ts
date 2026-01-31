import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAuth, requireRole, HttpError } from "@/lib/rbac";
import { branchUpdateSchema } from "@/lib/validators";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth(request);
    requireRole(session, [Role.HQ_ADMIN]);
    const body = branchUpdateSchema.parse(await request.json());

    const branch = await db.branch.update({
      where: { id: params.id },
      data: {
        name: body.name,
        code: body.code,
        isActive: body.isActive,
      },
    });

    return NextResponse.json(branch);
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

    const counts = await db.branch.findUnique({
      where: { id: params.id },
      include: { _count: { select: { users: true, documents: true } } },
    });

    if (!counts) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    if (counts._count.users > 0 || counts._count.documents > 0) {
      return NextResponse.json(
        { message: "Cannot delete branch with users or documents. Deactivate instead." },
        { status: 400 }
      );
    }

    await db.branch.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }
}
