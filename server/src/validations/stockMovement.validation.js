import { z } from "zod";

export const listStockMovementsQuerySchema = z.object({
  type: z
    .enum(["PURCHASE", "SALE", "RETURN", "WASTE", "ADJUSTMENT"])
    .optional(),
  productId: z.string().cuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});
