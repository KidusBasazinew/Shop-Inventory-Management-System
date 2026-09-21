import prisma from "../lib/prisma.js";
import ApiError from "../utils/apiError.js";

export async function listEmployees(shopId, { status, page, limit }) {
  const where = { shopId, ...(status ? { status } : {}) };

  const [items, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.employee.count({ where }),
  ]);

  return { items, total, page, limit };
}

export async function getOwnedEmployee(shopId, employeeId) {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });
  if (!employee || employee.shopId !== shopId)
    throw ApiError.notFound("Employee not found");
  return employee;
}

export async function getEmployee(shopId, employeeId) {
  return getOwnedEmployee(shopId, employeeId);
}

export async function createEmployee(shopId, data) {
  return prisma.employee.create({ data: { shopId, ...data } });
}

export async function updateEmployee(shopId, employeeId, data) {
  await getOwnedEmployee(shopId, employeeId);
  return prisma.employee.update({ where: { id: employeeId }, data });
}

export default {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  getOwnedEmployee,
};
