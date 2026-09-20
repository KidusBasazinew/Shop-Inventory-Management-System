import { z } from "zod";

const phoneSchema = z
  .string()
  .regex(/^(?:\+251|0)[97]\d{8}$/, "Enter a valid Ethiopian phone number");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Za-z]/, "Password must contain a letter")
  .regex(/[0-9]/, "Password must contain a number");

const staffRoleSchema = z.enum(["MANAGER", "CASHIER", "EMPLOYEE"]);

export const userIdParamSchema = z.object({
  id: z.string().cuid("Invalid user id"),
});

export const createUserSchema = z.object({
  name: z.string().min(2).max(120),
  phone: phoneSchema,
  password: passwordSchema,
  role: staffRoleSchema,
});

export const updateUserSchema = z
  .object({
    name: z.string().min(2).max(120).optional(),
    role: staffRoleSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update",
  });
