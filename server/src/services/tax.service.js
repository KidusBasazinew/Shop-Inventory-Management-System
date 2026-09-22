import prisma from "../lib/prisma.js";

export async function listTaxPayments(shopId, { page, limit }) {
  const where = { shopId };

  const [items, total] = await Promise.all([
    prisma.taxPayment.findMany({
      where,
      orderBy: { paidDate: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.taxPayment.count({ where }),
  ]);

  return { items, total, page, limit };
}

export async function createTaxPayment(shopId, data) {
  return prisma.taxPayment.create({ data: { shopId, ...data } });
}

export async function getVatReport(shopId, { from, to }) {
  const [salesAgg, paidAgg] = await Promise.all([
    prisma.sale.aggregate({
      where: { shopId, date: { gte: from, lte: to } },
      _sum: { taxAmount: true, subtotal: true, totalAmount: true },
      _count: true,
    }),
    prisma.taxPayment.aggregate({
      where: { shopId, paidDate: { gte: from, lte: to } },
      _sum: { amount: true },
    }),
  ]);

  const vatCollected = Number(salesAgg._sum.taxAmount ?? 0);
  const vatPaid = Number(paidAgg._sum.amount ?? 0);

  return {
    from,
    to,
    saleCount: salesAgg._count,
    subtotal: Number(salesAgg._sum.subtotal ?? 0),
    vatCollected,
    totalSales: Number(salesAgg._sum.totalAmount ?? 0),
    vatPaid,
    vatOutstanding: vatCollected - vatPaid,
  };
}

export default { listTaxPayments, createTaxPayment, getVatReport };
