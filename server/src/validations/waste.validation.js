import { z } from "zod";

const reasonSchema = z.enum([
  "EXPIRED",
  "RAT_DAMAGE",
  "BROKEN",
  "SPOILED",
  "OTHER",
]);

export const wasteIdParamSchema = z.object({
  id: z.string().cuid("Invalid waste record id"),
});

export const createWasteSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.coerce.number().positive(),
  reason: reasonSchema,
  photoUrl: z.string().url().optional(),
  date: z.coerce.date().optional(),
});

export const listWasteQuerySchema = z.object({
  productId: z.string().cuid().optional(),
  reason: reasonSchema.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});
