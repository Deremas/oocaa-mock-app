import { db } from "@/lib/db";
import { getSessionUserFromCookies } from "@/lib/auth";
import { Role } from "@prisma/client";
import { ReportsSummary } from "@/components/modules/reports/ReportsSummary";

export default async function ReportsPage() {
  const session = await getSessionUserFromCookies();
  if (!session) return null;
  const branches = await db.branch.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Reports</h1>
      <ReportsSummary branches={branches} showBranch={session.role === Role.HQ_ADMIN} />
    </div>
  );
}
