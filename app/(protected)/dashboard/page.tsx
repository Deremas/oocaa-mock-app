import { DocumentStatus, Role } from "@prisma/client";
import { db } from "@/lib/db";
import { getSessionUserFromCookies } from "@/lib/auth";
import { StatCards } from "@/components/modules/dashboard/StatCards";
import { DocumentTable } from "@/components/modules/documents/DocumentTable";

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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <StatCards
        stats={[
          { label: "Total (30 days)", value: totalDocs },
          { label: "Submitted", value: countByStatus(DocumentStatus.SUBMITTED) },
          { label: "Reviewed", value: countByStatus(DocumentStatus.REVIEWED) },
          { label: "Approved", value: countByStatus(DocumentStatus.APPROVED) },
          { label: "Rejected", value: countByStatus(DocumentStatus.REJECTED) },
        ]}
      />
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">
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
