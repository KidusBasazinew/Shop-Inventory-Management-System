import prisma from "../lib/prisma.js";
import ApiError from "../utils/apiError.js";

export async function listExpenses(
  shopId,
  { category, from, to, page, limit },
) {
  const where = {
    shopId,
    ...(category ? { category } : {}),
    ...(from || to
      ? { date: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
      : {}),
  };

  const [items, total, sum] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.expense.count({ where }),
    prisma.expense.aggregate({ where, _sum: { amount: true } }),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalAmount: Number(sum._sum.amount ?? 0),
  };
}

async function getOwnedExpense(shopId, expenseId) {
  const expense = await prisma.expense.findUnique({ where: { id: expenseId } });
  if (!expense || expense.shopId !== shopId)
    throw ApiError.notFound("Expense not found");
  return expense;
}

export async function getExpense(shopId, expenseId) {
  return getOwnedExpense(shopId, expenseId);
}

export async function createExpense(shopId, data) {
  return prisma.expense.create({
    data: { shopId, date: data.date ?? new Date(), ...data },
  });
}

export async function updateExpense(shopId, expenseId, data) {
  await getOwnedExpense(shopId, expenseId);
  return prisma.expense.update({ where: { id: expenseId }, data });
}

export async function deleteExpense(shopId, expenseId) {
  await getOwnedExpense(shopId, expenseId);
  await prisma.expense.delete({ where: { id: expenseId } });
}

export default {
  listExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
};
