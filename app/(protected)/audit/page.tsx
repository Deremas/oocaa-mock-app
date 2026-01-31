import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { getSessionUserFromCookies } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuditLogTable } from "@/components/modules/audit/AuditLogTable";

export default async function AuditPage() {
  const session = await getSessionUserFromCookies();
  if (!session) return null;

  const branches = await db.branch.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Audit Logs</h1>
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <AuditLogTable branches={branches} showBranch={session.role === Role.HQ_ADMIN} />
        </CardContent>
      </Card>
    </div>
  );
}
