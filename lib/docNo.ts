import { db } from "@/lib/db";

export async function generateDocumentNo(branchId: string, year: number) {
  return db.$transaction(async (tx) => {
    const branch = await tx.branch.findUnique({ where: { id: branchId } });
    if (!branch) {
      throw new Error("Branch not found");
    }
    const sequence = await tx.docSequence.upsert({
      where: { branchId_year: { branchId, year } },
      update: { lastSeq: { increment: 1 } },
      create: { branchId, year, lastSeq: 1 },
    });
    const seq = sequence.lastSeq;
    const padded = String(seq).padStart(4, "0");
    return `OOCAA-${branch.code}-${year}-${padded}`;
  });
}
