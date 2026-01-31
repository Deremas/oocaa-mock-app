import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { getSessionUserFromCookies } from "@/lib/auth";
import { AdminUsersClient } from "@/components/modules/admin/AdminUsersClient";

export default async function AdminUsersPage() {
  const session = await getSessionUserFromCookies();
  if (!session || session.role !== Role.HQ_ADMIN) {
    redirect("/dashboard");
  }

  const users = await db.user.findMany({
    include: { branch: true },
    orderBy: { createdAt: "desc" },
  });
  const branches = await db.branch.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold text-slate-900">Admin Users</h1>
      <AdminUsersClient
        users={users.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          branchName: user.branch?.name ?? null,
          branchId: user.branch?.id ?? null,
          isActive: user.isActive,
        }))}
        branches={branches}
      />
    </div>
  );
}
