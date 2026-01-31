import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getSessionUserFromCookies } from "@/lib/auth";
import { BranchManagement } from "@/components/modules/admin/BranchManagement";

export default async function AdminBranchesPage() {
  const session = await getSessionUserFromCookies();
  if (!session || session.role !== Role.HQ_ADMIN) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold text-slate-900">Admin Branches</h1>
      <BranchManagement />
    </div>
  );
}
