import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAuth, requireRole, HttpError } from "@/lib/rbac";
import { branchCreateSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    requireRole(session, [Role.HQ_ADMIN]);

    const branches = await db.branch.findMany({
      include: {
        _count: { select: { users: true, documents: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(branches);
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
    const body = branchCreateSchema.parse(await request.json());

    const branch = await db.branch.create({
      data: {
        name: body.name,
        code: body.code,
        isActive: true,
      },
    });

    return NextResponse.json(branch, { status: 201 });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }
}
