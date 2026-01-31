import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/auth";

export async function getCurrentUser(session: SessionUser) {
  return db.user.findUnique({
    where: { id: session.id },
    include: { branch: true },
  });
}
