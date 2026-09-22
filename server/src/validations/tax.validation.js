import { z } from "zod";

export const createTaxPaymentSchema = z.object({
  amount: z.coerce.number().positive(),
  period: z.string().min(4).max(20), // e.g. "2026-08"
  paidDate: z.coerce.date(),
  reference: z.string().max(120).optional(),
});

export const listTaxPaymentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export const vatReportQuerySchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
});
