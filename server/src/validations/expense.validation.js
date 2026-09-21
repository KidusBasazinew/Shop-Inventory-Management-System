import { z } from "zod";

const categorySchema = z.enum([
  "RENT",
  "ELECTRICITY",
  "WATER",
  "SALARY",
  "TRANSPORT",
  "OTHER",
]);

export const expenseIdParamSchema = z.object({
  id: z.string().cuid("Invalid expense id"),
});

export const createExpenseSchema = z.object({
  category: categorySchema,
  amount: z.coerce.number().positive(),
  date: z.coerce.date().optional(),
  description: z.string().max(255).optional(),
});

export const updateExpenseSchema = z
  .object({
    category: categorySchema.optional(),
    amount: z.coerce.number().positive().optional(),
    date: z.coerce.date().optional(),
    description: z.string().max(255).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update",
  });

export const listExpensesQuerySchema = z.object({
  category: categorySchema.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});
