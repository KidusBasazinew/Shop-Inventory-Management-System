import { z } from "zod";

export const saleIdParamSchema = z.object({
  id: z.string().cuid("Invalid sale id"),
});

const saleItemSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.coerce.number().positive(),
  // Optional override — omit to charge the product's current sellingPrice.
  unitPrice: z.coerce.number().nonnegative().optional(),
});

export const createSaleSchema = z.object({
  customerId: z.string().cuid().optional(),
  date: z.coerce.date().optional(),
  items: z.array(saleItemSchema).min(1, "At least one item is required"),
  // Omit to record the sale as fully paid. Set lower than the total (and
  // provide customerId) to record it as a partial/credit sale.
  amountPaid: z.coerce.number().nonnegative().optional(),
  paymentMethod: z
    .enum(["CASH", "BANK_TRANSFER", "MOBILE_MONEY", "CHEQUE", "OTHER"])
    .default("CASH"),
});

export const listSalesQuerySchema = z.object({
  customerId: z.string().cuid().optional(),
  status: z.enum(["UNPAID", "PARTIAL", "PAID"]).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});
