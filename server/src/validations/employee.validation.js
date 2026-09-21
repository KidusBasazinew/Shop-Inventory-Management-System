import { z } from "zod";

export const employeeIdParamSchema = z.object({
  id: z.string().cuid("Invalid employee id"),
});

export const createEmployeeSchema = z.object({
  name: z.string().min(2).max(150),
  phone: z.string().max(30).optional(),
  position: z.string().max(100).optional(),
  salary: z.coerce.number().nonnegative(),
});

export const updateEmployeeSchema = z
  .object({
    name: z.string().min(2).max(150).optional(),
    phone: z.string().max(30).optional(),
    position: z.string().max(100).optional(),
    salary: z.coerce.number().nonnegative().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update",
  });

export const listEmployeesQuerySchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});
