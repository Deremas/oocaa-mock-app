import { DocumentStatus, Role } from "@prisma/client";
import { db } from "@/lib/db";
import { getSessionUserFromCookies } from "@/lib/auth";
import { StatCards } from "@/components/modules/dashboard/StatCards";
import { DocumentTable } from "@/components/modules/documents/DocumentTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function DashboardPage() {
  const session = await getSessionUserFromCookies();
  if (!session) return null;

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const whereBase =
    session.role === Role.BRANCH_ADMIN ? { branchId: session.branchId ?? "missing" } : {};

  const totalDocs = await db.document.count({
    where: { ...whereBase, createdAt: { gte: since } },
  });

  const statusCounts = await db.document.groupBy({
    by: ["status"],
    _count: { status: true },
    where: whereBase,
  });

  const countByStatus = (status: DocumentStatus) =>
    statusCounts.find((item) => item.status === status)?._count.status ?? 0;

  const workQueueStatus = session.role === Role.HQ_ADMIN ? DocumentStatus.REVIEWED : DocumentStatus.SUBMITTED;
  const workQueue = await db.document.findMany({
    where: { status: workQueueStatus, ...whereBase },
    include: { branch: true, _count: { select: { attachments: true } } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const branchTotals =
    session.role === Role.HQ_ADMIN
      ? await db.document.groupBy({
          by: ["branchId"],
          _count: { branchId: true },
        })
      : [];

  const branches = session.role === Role.HQ_ADMIN ? await db.branch.findMany() : [];
  const branchMap = new Map(branches.map((branch) => [branch.id, branch.name]));

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
      <StatCards
        stats={[
          { label: "Total", value: totalDocs, type: "total" },
          { label: "Submitted", value: countByStatus(DocumentStatus.SUBMITTED), type: "submitted" },
          { label: "Reviewed", value: countByStatus(DocumentStatus.REVIEWED), type: "reviewed" },
          { label: "Approved", value: countByStatus(DocumentStatus.APPROVED), type: "approved" },
          { label: "Rejected", value: countByStatus(DocumentStatus.REJECTED), type: "rejected" },
        ]}
      />
      {session.role === Role.HQ_ADMIN ? (
        <Card>
          <CardHeader>
            <CardTitle>Branch Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Branch</TableHead>
                  <TableHead className="text-right">Total Documents</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branchTotals.map((item) => (
                  <TableRow key={item.branchId}>
                    <TableCell>{branchMap.get(item.branchId) ?? item.branchId}</TableCell>
                    <TableCell className="text-right">{item._count.branchId}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-800">
          {session.role === Role.HQ_ADMIN ? "HQ Review Queue" : "Branch Work Queue"}
        </h2>
        <DocumentTable
          rows={workQueue.map((doc) => ({
            id: doc.id,
            docNo: doc.docNo,
            candidateName: doc.candidateName,
            branchName: doc.branch.name,
            status: doc.status,
            attachmentCount: doc._count?.attachments ?? 0,
            createdAt: doc.createdAt,
          }))}
        />
      </div>
    </div>
  );
}
