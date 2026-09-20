import { z } from "zod";

export const purchaseIdParamSchema = z.object({
  id: z.string().cuid("Invalid purchase id"),
});

const purchaseItemSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.coerce.number().positive(),
  unitCost: z.coerce.number().nonnegative(),
});

export const createPurchaseSchema = z.object({
  supplierId: z.string().cuid(),
  date: z.coerce.date().optional(),
  items: z.array(purchaseItemSchema).min(1, "At least one item is required"),
});

export const listPurchasesQuerySchema = z.object({
  supplierId: z.string().cuid().optional(),
  status: z.enum(["UNPAID", "PARTIAL", "PAID"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});
