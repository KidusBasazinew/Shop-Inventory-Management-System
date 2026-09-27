import { z } from "zod";

export const requestSubscriptionSchema = z.object({
  planMonths: z.coerce
    .number()
    .int()
    .min(1, "Choose a plan of 1, 3 or 12 months")
    .max(12),
  payerName: z.string().min(2).max(120).optional(),
  payerPhone: z.string().min(5).max(30).optional(),
  bankReference: z.string().min(2).max(120).optional(),
});

export const subscriptionPaymentIdParamSchema = z.object({
  id: z.string().min(1),
});
