import { z } from "zod";

const unitTypeSchema = z.enum(["PIECE", "CARTON", "KG", "LITER"]);

export const productIdParamSchema = z.object({
  id: z.string().cuid("Invalid product id"),
});

export const createProductSchema = z.object({
  name: z.string().min(2).max(150),
  photoUrl: z.string().url().optional(),
  category: z.string().max(80).optional(),
  supplierId: z.string().cuid().optional(),
  unitType: unitTypeSchema.default("PIECE"),
  unitsPerPackage: z.coerce.number().int().positive().optional(),
  buyingPrice: z.coerce.number().nonnegative(),
  sellingPrice: z.coerce.number().nonnegative(),
  quantity: z.coerce.number().nonnegative().default(0), // initial stock, optional
  minQuantityAlert: z.coerce.number().nonnegative().default(0),
  expiryDate: z.coerce.date().optional(),
});

export const updateProductSchema = z
  .object({
    name: z.string().min(2).max(150).optional(),
    photoUrl: z.string().url().optional(),
    category: z.string().max(80).optional(),
    supplierId: z.string().cuid().optional(),
    unitType: unitTypeSchema.optional(),
    unitsPerPackage: z.coerce.number().int().positive().optional(),
    buyingPrice: z.coerce.number().nonnegative().optional(),
    sellingPrice: z.coerce.number().nonnegative().optional(),
    minQuantityAlert: z.coerce.number().nonnegative().optional(),
    expiryDate: z.coerce.date().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update",
  });

export const listProductsQuerySchema = z.object({
  search: z.string().max(150).optional(),
  category: z.string().max(80).optional(),
  lowStock: z.coerce.boolean().optional(), // quantity <= minQuantityAlert
  expiringWithinDays: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});
