import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { getSessionUserFromCookies } from "@/lib/auth";
import { DocumentFilters } from "@/components/modules/documents/DocumentFilters";
import { DocumentTable } from "@/components/modules/documents/DocumentTable";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function DocumentsPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getSessionUserFromCookies();
  if (!session) return null;

  const where: Record<string, unknown> = {};
  const q = Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q;
  const status = Array.isArray(searchParams.status) ? searchParams.status[0] : searchParams.status;
  const branchId = Array.isArray(searchParams.branchId) ? searchParams.branchId[0] : searchParams.branchId;
  const dateFrom = Array.isArray(searchParams.dateFrom) ? searchParams.dateFrom[0] : searchParams.dateFrom;
  const dateTo = Array.isArray(searchParams.dateTo) ? searchParams.dateTo[0] : searchParams.dateTo;

  if (q) {
    where.OR = [
      { docNo: { contains: q, mode: "insensitive" } },
      { candidateName: { contains: q, mode: "insensitive" } },
      { paymentReceiptNo: { contains: q, mode: "insensitive" } },
    ];
  }
  if (status) {
    where.status = status;
  }
  if (dateFrom || dateTo) {
    where.createdAt = {
      gte: dateFrom ? new Date(dateFrom) : undefined,
      lte: dateTo ? new Date(dateTo) : undefined,
    };
  }
  if (session.role === Role.BRANCH_ADMIN) {
    where.branchId = session.branchId ?? "missing";
  } else if (branchId) {
    where.branchId = branchId;
  }

  const documents = await db.document.findMany({
    where,
    include: { branch: true, _count: { select: { attachments: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const branches = await db.branch.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Documents</h1>
      </div>
      <DocumentFilters
        branches={branches}
        showBranch={session.role === Role.HQ_ADMIN}
        initial={{
          q: q ?? "",
          status: status ?? "",
          branchId: branchId ?? "",
          dateFrom: dateFrom ?? "",
          dateTo: dateTo ?? "",
        }}
      />
      <DocumentTable
        rows={documents.map((doc) => ({
          id: doc.id,
          docNo: doc.docNo,
          candidateName: doc.candidateName,
          branchName: doc.branch.name,
          status: doc.status,
          attachmentCount: (doc as unknown as { _count?: { attachments: number } })._count?.attachments ?? 0,
          createdAt: doc.createdAt,
        }))}
      />
    </div>
  );
}
