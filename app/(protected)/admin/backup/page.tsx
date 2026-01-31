import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getSessionUserFromCookies } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function BackupPage() {
  const session = await getSessionUserFromCookies();
  if (!session || session.role !== Role.HQ_ADMIN) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Backup Policy</h1>
      <Card>
        <CardHeader>
          <CardTitle>Operational Policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Daily backups at 02:00 local time.</p>
          <p>Point-in-time recovery (PITR) enabled with 7-day retention.</p>
          <p>Restore tests scheduled monthly.</p>
          <div className="mt-4 rounded-md border bg-white p-3">
            <div className="text-xs uppercase text-muted-foreground">Last Backup</div>
            <div className="text-sm font-medium">January 29, 2026 02:00</div>
            <div className="text-xs uppercase text-muted-foreground mt-2">Next Restore Test</div>
            <div className="text-sm font-medium">February 15, 2026</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
