import { z } from "zod";

export const updateShopSchema = z
  .object({
    name: z.string().min(2).max(120).optional(),
    location: z.string().max(255).optional(),
    phone: z.string().max(30).optional(),
    ownerName: z.string().min(2).max(120).optional(),
    taxRatePercent: z.coerce.number().min(0).max(100).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update",
  });
