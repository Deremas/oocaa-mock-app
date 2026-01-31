import { PrismaClient, AttachmentKind, AuditAction, DocumentStatus, DocumentType, EntityType, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function ensureUploads() {
  const uploadPath = path.join(process.cwd(), "uploads");
  await mkdir(uploadPath, { recursive: true });
  return uploadPath;
}

async function main() {
  const uploadsDir = await ensureUploads();

  const [addis, adama, jimma] = await prisma.$transaction([
    prisma.branch.upsert({
      where: { code: "ADDIS" },
      update: {},
      create: { name: "Addis Ababa", code: "ADDIS" },
    }),
    prisma.branch.upsert({
      where: { code: "ADAMA" },
      update: {},
      create: { name: "Adama", code: "ADAMA" },
    }),
    prisma.branch.upsert({
      where: { code: "JIMMA" },
      update: {},
      create: { name: "Jimma", code: "JIMMA" },
    }),
  ]);

  const passwordHash = await bcrypt.hash("Passw0rd!", 10);

  const hq = await prisma.user.upsert({
    where: { email: "hq@oocaa.local" },
    update: {},
    create: {
      name: "HQ Admin",
      email: "hq@oocaa.local",
      passwordHash,
      role: Role.HQ_ADMIN,
      branchId: addis.id,
    },
  });

  const adamaAdmin = await prisma.user.upsert({
    where: { email: "adama@oocaa.local" },
    update: {},
    create: {
      name: "Adama Admin",
      email: "adama@oocaa.local",
      passwordHash,
      role: Role.BRANCH_ADMIN,
      branchId: adama.id,
    },
  });

  const auditor = await prisma.user.upsert({
    where: { email: "audit@oocaa.local" },
    update: {},
    create: {
      name: "Auditor",
      email: "audit@oocaa.local",
      passwordHash,
      role: Role.AUDITOR,
      branchId: addis.id,
    },
  });

  await prisma.docSequence.upsert({
    where: { branchId_year: { branchId: adama.id, year: 2026 } },
    update: { lastSeq: 7 },
    create: { branchId: adama.id, year: 2026, lastSeq: 7 },
  });

  const submittedDoc = await prisma.document.upsert({
    where: { docNo: "OOCAA-ADAMA-2026-0007" },
    update: {},
    create: {
      docNo: "OOCAA-ADAMA-2026-0007",
      type: DocumentType.ASSESSMENT_APPLICATION,
      status: DocumentStatus.SUBMITTED,
      branchId: adama.id,
      candidateName: "Mekdes Girma",
      candidateIdNumber: "ET-991122",
      phone: "0911001122",
      occupation: "Welder",
      level: "II",
      paymentReceiptNo: "RCT-AD-7721",
      paymentAmount: 45000,
      paymentDate: new Date("2026-01-10T09:00:00Z"),
      paymentMethod: "Bank Transfer",
      createdByUserId: adamaAdmin.id,
    },
  });

  const reviewedDoc = await prisma.document.upsert({
    where: { docNo: "OOCAA-ADAMA-2026-0008" },
    update: {},
    create: {
      docNo: "OOCAA-ADAMA-2026-0008",
      type: DocumentType.ASSESSMENT_APPLICATION,
      status: DocumentStatus.REVIEWED,
      branchId: adama.id,
      candidateName: "Hana Tesfaye",
      candidateIdNumber: "ET-882311",
      phone: "0911002233",
      occupation: "Electrician",
      level: "III",
      paymentReceiptNo: "RCT-AD-8891",
      paymentAmount: 52000,
      paymentDate: new Date("2026-01-12T08:30:00Z"),
      paymentMethod: "Cash",
      createdByUserId: adamaAdmin.id,
      reviewedByUserId: adamaAdmin.id,
    },
  });

  const approvedDoc = await prisma.document.upsert({
    where: { docNo: "OOCAA-JIMMA-2026-0001" },
    update: {},
    create: {
      docNo: "OOCAA-JIMMA-2026-0001",
      type: DocumentType.ASSESSMENT_APPLICATION,
      status: DocumentStatus.APPROVED,
      branchId: jimma.id,
      candidateName: "Yared Bekele",
      candidateIdNumber: "ET-551910",
      phone: "0911003344",
      occupation: "Plumber",
      level: "I",
      paymentReceiptNo: "RCT-JM-2211",
      paymentAmount: 41000,
      paymentDate: new Date("2026-01-08T10:00:00Z"),
      paymentMethod: "Bank Transfer",
      createdByUserId: hq.id,
      reviewedByUserId: hq.id,
      approvedByUserId: hq.id,
    },
  });

  const storedName = `${randomUUID()}-receipt.txt`;
  const storagePath = path.join(uploadsDir, storedName);
  await writeFile(storagePath, "Mock payment receipt file");

  await prisma.attachment.create({
    data: {
      documentId: submittedDoc.id,
      kind: AttachmentKind.PAYMENT_RECEIPT,
      originalName: "receipt.txt",
      storedName,
      mimeType: "text/plain",
      sizeBytes: 26,
      storagePath,
      uploadedByUserId: adamaAdmin.id,
    },
  });

  await prisma.documentVersion.createMany({
    data: [
      {
        documentId: submittedDoc.id,
        versionNumber: 1,
        snapshotJson: JSON.parse(JSON.stringify(submittedDoc)),
        createdByUserId: adamaAdmin.id,
      },
      {
        documentId: reviewedDoc.id,
        versionNumber: 1,
        snapshotJson: JSON.parse(JSON.stringify(reviewedDoc)),
        createdByUserId: adamaAdmin.id,
      },
      {
        documentId: approvedDoc.id,
        versionNumber: 1,
        snapshotJson: JSON.parse(JSON.stringify(approvedDoc)),
        createdByUserId: hq.id,
      },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      {
        actorUserId: hq.id,
        actorEmail: hq.email,
        action: AuditAction.LOGIN,
        entityType: EntityType.USER,
        entityId: hq.id,
        branchId: addis.id,
        detailsJson: { seeded: true },
      },
      {
        actorUserId: adamaAdmin.id,
        actorEmail: adamaAdmin.email,
        action: AuditAction.DOCUMENT_CREATED,
        entityType: EntityType.DOCUMENT,
        entityId: submittedDoc.id,
        branchId: adama.id,
        detailsJson: { docNo: submittedDoc.docNo },
      },
      {
        actorUserId: hq.id,
        actorEmail: hq.email,
        action: AuditAction.STATUS_CHANGED,
        entityType: EntityType.DOCUMENT,
        entityId: approvedDoc.id,
        branchId: jimma.id,
        detailsJson: { status: approvedDoc.status },
      },
    ],
  });

  await prisma.$disconnect();
  await pool.end();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  await pool.end();
  process.exit(1);
});
