import prisma from "../lib/prisma.js";
import { getOwnedEmployee } from "./employee.service.js";

export async function listPayrollPayments(
  shopId,
  employeeId,
  { from, to, page, limit },
) {
  await getOwnedEmployee(shopId, employeeId);

  const where = {
    employeeId,
    ...(from || to
      ? { date: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.payrollPayment.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.payrollPayment.count({ where }),
  ]);

  return { items, total, page, limit };
}

export async function recordPayrollPayment(shopId, employeeId, data) {
  await getOwnedEmployee(shopId, employeeId);
  return prisma.payrollPayment.create({
    data: { employeeId, date: data.date ?? new Date(), ...data },
  });
}

export default { listPayrollPayments, recordPayrollPayment };
