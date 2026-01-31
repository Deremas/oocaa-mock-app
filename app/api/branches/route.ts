import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request);
    const branches = await db.branch.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(branches);
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}
