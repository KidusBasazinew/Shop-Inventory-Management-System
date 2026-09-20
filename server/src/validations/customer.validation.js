import { z } from "zod";

export const customerIdParamSchema = z.object({
  id: z.string().cuid("Invalid customer id"),
});

export const createCustomerSchema = z.object({
  name: z.string().min(2).max(150),
  shopName: z.string().max(150).optional(),
  phone: z.string().max(30).optional(),
  location: z.string().max(255).optional(),
});

export const updateCustomerSchema = z
  .object({
    name: z.string().min(2).max(150).optional(),
    shopName: z.string().max(150).optional(),
    phone: z.string().max(30).optional(),
    location: z.string().max(255).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update",
  });

export const listCustomersQuerySchema = z.object({
  search: z.string().max(150).optional(),
  hasBalance: z.coerce.boolean().optional(), // only customers who owe money
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});
