import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAuth, HttpError } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId") ?? undefined;
    const action = searchParams.get("action") ?? undefined;
    const actor = searchParams.get("actor") ?? undefined;
    const dateFrom = searchParams.get("dateFrom") ?? undefined;
    const dateTo = searchParams.get("dateTo") ?? undefined;
    const docNo = searchParams.get("docNo") ?? undefined;
    const page = Number(searchParams.get("page") ?? "1");
    const pageSize = Number(searchParams.get("pageSize") ?? "50");

    const where: Record<string, unknown> = {};

    if (action) where.action = action;
    if (actor) where.actorEmail = { contains: actor, mode: "insensitive" };
    if (dateFrom || dateTo) {
      where.createdAt = {
        gte: dateFrom ? new Date(dateFrom) : undefined,
        lte: dateTo ? new Date(dateTo) : undefined,
      };
    }
    if (docNo) {
      const doc = await db.document.findUnique({ where: { docNo } });
      if (doc) {
        where.entityId = doc.id;
      } else {
        return NextResponse.json([]);
      }
    }

    if (session.role === Role.BRANCH_ADMIN) {
      where.branchId = session.branchId ?? "missing";
    } else if (branchId) {
      where.branchId = branchId;
    }

    const logs = await db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip: (page - 1) * pageSize,
    });

    return NextResponse.json(logs);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}
