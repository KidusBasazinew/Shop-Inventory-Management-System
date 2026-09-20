import { z } from "zod";

export const supplierIdParamSchema = z.object({
  id: z.string().cuid("Invalid supplier id"),
});

export const createSupplierSchema = z.object({
  name: z.string().min(2).max(150),
  phone: z.string().max(30).optional(),
  address: z.string().max(255).optional(),
});

export const updateSupplierSchema = z
  .object({
    name: z.string().min(2).max(150).optional(),
    phone: z.string().max(30).optional(),
    address: z.string().max(255).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update",
  });

export const listSuppliersQuerySchema = z.object({
  search: z.string().max(150).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});
