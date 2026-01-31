import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, enforceBranchAccess, HttpError } from "@/lib/rbac";
import { readFile } from "fs/promises";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth(request);
    const attachment = await db.attachment.findUnique({
      where: { id: params.id },
      include: { document: true },
    });
    if (!attachment) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    enforceBranchAccess(session, attachment.document.branchId, "read");

    const fileBuffer = await readFile(attachment.storagePath);
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Disposition": `attachment; filename="${attachment.originalName}"`,
      },
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }
}
