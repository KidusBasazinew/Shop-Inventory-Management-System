import { z } from "zod";

// Ethiopian phone numbers: accept 09xxxxxxxx / 07xxxxxxxx or +2519xxxxxxxx / +2517xxxxxxxx
const phoneSchema = z
  .string()
  .regex(/^(?:\+251|0)[97]\d{8}$/, "Enter a valid Ethiopian phone number");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Za-z]/, "Password must contain a letter")
  .regex(/[0-9]/, "Password must contain a number");

const registerSchema = z.object({
  shopName: z.string().min(2).max(120),
  shopLocation: z.string().max(255).optional(),
  ownerName: z.string().min(2).max(120),
  phone: phoneSchema,
  password: passwordSchema,
});

const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, "Password is required"),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(20, "A valid refresh token is required"),
});

export { registerSchema, loginSchema, refreshSchema };
