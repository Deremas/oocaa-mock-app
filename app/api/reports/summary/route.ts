import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId") ?? undefined;
    const dateFrom = searchParams.get("dateFrom") ?? undefined;
    const dateTo = searchParams.get("dateTo") ?? undefined;

    const where: Record<string, unknown> = {};
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

    const totalsByStatus = await db.document.groupBy({
      by: ["status"],
      _count: { status: true },
      where,
    });

    const totalsByBranch =
      session.role === Role.HQ_ADMIN
        ? await db.document.groupBy({
            by: ["branchId"],
            _count: { branchId: true },
            where,
          })
        : [];

    const totalCount = await db.document.count({ where });

    return NextResponse.json({
      totalsByStatus,
      totalsByBranch,
      totalCount,
    });
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}
