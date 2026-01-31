import type { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { getSessionUser, type SessionUser } from "@/lib/auth";

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function requireAuth(request: NextRequest) {
  const session = await getSessionUser(request);
  if (!session) {
    throw new HttpError(401, "Unauthorized");
  }
  return session;
}

export function requireRole(user: SessionUser, roles: Role[]) {
  if (!roles.includes(user.role)) {
    throw new HttpError(403, "Forbidden");
  }
}

export function enforceBranchAccess(user: SessionUser, branchId: string, mode: "read" | "write") {
  if (user.role === Role.HQ_ADMIN) return;
  if (user.role === Role.AUDITOR) {
    if (mode === "write") {
      throw new HttpError(403, "Auditor is read-only");
    }
    return;
  }
  if (user.branchId !== branchId) {
    throw new HttpError(403, "Branch access denied");
  }
}
