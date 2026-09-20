import { z } from "zod";

export const addStockSchema = z.object({
  quantity: z.coerce.number().positive(),
  note: z.string().max(255).optional(),
});

export const removeStockSchema = z.object({
  quantity: z.coerce.number().positive(),
  note: z.string().max(255).optional(),
});

export const adjustStockSchema = z.object({
  newQuantity: z.coerce.number().nonnegative(), // physical count the owner counted
  note: z.string().max(255).optional(),
});

export const stockHistoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});
