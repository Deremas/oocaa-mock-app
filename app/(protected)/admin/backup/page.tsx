import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getSessionUserFromCookies } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { kpiCardClass, kpiIcon, kpiIconClass } from "@/lib/ui/kpi";

export default async function BackupPage() {
  const session = await getSessionUserFromCookies();
  if (!session || session.role !== Role.HQ_ADMIN) {
    redirect("/dashboard");
  }

  const TotalIcon = kpiIcon("total");
  const ApprovedIcon = kpiIcon("approved");

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold text-slate-900">Backup Policy</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className={kpiCardClass("total")}>
          <CardHeader>
            <CardTitle>Last Backup</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-lg font-semibold">January 29, 2026 02:00</div>
            <TotalIcon className={`h-5 w-5 ${kpiIconClass("total")}`} />
          </CardContent>
        </Card>
        <Card className={kpiCardClass("approved")}>
          <CardHeader>
            <CardTitle>Next Restore Test</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-lg font-semibold">February 15, 2026</div>
            <ApprovedIcon className={`h-5 w-5 ${kpiIconClass("approved")}`} />
          </CardContent>
        </Card>
      </div>
      <Card className="border-l-4 border-l-green-800">
        <CardHeader>
          <CardTitle>Operational Policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Daily backups at 02:00 local time.</p>
          <p>Point-in-time recovery (PITR) enabled with 7-day retention.</p>
          <p>Restore tests scheduled monthly.</p>
        </CardContent>
      </Card>
    </div>
  );
}
