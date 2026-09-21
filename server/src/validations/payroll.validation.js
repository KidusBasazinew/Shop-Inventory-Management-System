import { z } from "zod";

export const createPayrollPaymentSchema = z.object({
  salary: z.coerce.number().nonnegative(),
  bonus: z.coerce.number().nonnegative().default(0),
  deduction: z.coerce.number().nonnegative().default(0),
  amountPaid: z.coerce.number().nonnegative(),
  date: z.coerce.date().optional(),
});

export const listPayrollQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});
