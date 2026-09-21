import { z } from "zod";

export const paymentIdParamSchema = z.object({
  id: z.string().cuid("Invalid payment id"),
});

const methodSchema = z
  .enum(["CASH", "BANK_TRANSFER", "MOBILE_MONEY", "CHEQUE", "OTHER"])
  .default("CASH");

// If `allocations` is omitted, the payment is auto-applied to the
// customer/supplier's open sales/purchases oldest-first. Pass it explicitly
// to control exactly which sales/purchases this payment covers.
const allocationSchema = z.object({
  targetId: z.string().cuid(), // a saleId or purchaseId depending on endpoint
  amount: z.coerce.number().positive(),
});

export const createCustomerPaymentSchema = z.object({
  customerId: z.string().cuid(),
  amount: z.coerce.number().positive(),
  method: methodSchema,
  reference: z.string().max(120).optional(),
  note: z.string().max(255).optional(),
  date: z.coerce.date().optional(),
  allocations: z.array(allocationSchema).optional(),
});

export const createSupplierPaymentSchema = z.object({
  supplierId: z.string().cuid(),
  amount: z.coerce.number().positive(),
  method: methodSchema,
  reference: z.string().max(120).optional(),
  note: z.string().max(255).optional(),
  date: z.coerce.date().optional(),
  allocations: z.array(allocationSchema).optional(),
});

export const listPaymentsQuerySchema = z.object({
  type: z.enum(["CUSTOMER_PAYMENT", "SUPPLIER_PAYMENT"]).optional(),
  customerId: z.string().cuid().optional(),
  supplierId: z.string().cuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});
