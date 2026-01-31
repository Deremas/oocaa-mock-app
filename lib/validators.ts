import { z } from "zod";
import { AttachmentKind, DocumentStatus, Role } from "@prisma/client";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const documentCreateSchema = z.object({
  branchId: z.string().optional(),
  candidateName: z.string().min(2),
  candidateIdNumber: z.string().optional(),
  phone: z.string().optional(),
  occupation: z.string().min(2),
  level: z.string().min(1),
  paymentReceiptNo: z.string().min(2),
  paymentAmount: z.number().int().positive(),
  paymentDate: z.string().datetime(),
  paymentMethod: z.string().min(2),
});

export const documentUpdateSchema = z.object({
  candidateName: z.string().min(2).optional(),
  candidateIdNumber: z.string().optional(),
  phone: z.string().optional(),
  occupation: z.string().min(2).optional(),
  level: z.string().min(1).optional(),
  paymentReceiptNo: z.string().optional(),
  paymentAmount: z.number().int().positive().optional(),
  paymentDate: z.string().datetime().optional(),
  paymentMethod: z.string().optional(),
});

export const statusUpdateSchema = z.object({
  nextStatus: z.nativeEnum(DocumentStatus),
  rejectReason: z.string().min(3).optional(),
});

export const attachmentSchema = z.object({
  kind: z.nativeEnum(AttachmentKind),
});

export const userCreateSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.nativeEnum(Role),
  branchId: z.string().optional(),
});

export const userPatchSchema = z.object({
  isActive: z.boolean().optional(),
  resetPassword: z.string().min(6).optional(),
});
