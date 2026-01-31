import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUserFromCookies } from "@/lib/auth";
import { DocumentForm } from "@/components/modules/documents/DocumentForm";

export default async function NewDocumentPage() {
  const session = await getSessionUserFromCookies();
  if (!session) return null;
  if (session.role === Role.AUDITOR) {
    redirect("/documents");
  }

  const branches =
    session.role === Role.HQ_ADMIN
      ? await db.branch.findMany({ where: { isActive: true }, orderBy: { name: "asc" } })
      : await db.branch.findMany({ where: { id: session.branchId ?? "" } });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold text-slate-900">New Document</h1>
      <DocumentForm branches={branches} />
    </div>
  );
}
