import prisma from "../lib/prisma.js";

const EXPIRING_SOON_DAYS = 30;

export async function getDashboard(shopId) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const expiringCutoff = new Date(
    Date.now() + EXPIRING_SOON_DAYS * 24 * 60 * 60 * 1000,
  );

  const [
    salesTodayAgg,
    moneyReceivedTodayAgg,
    expensesTodayAgg,
    totalSalesAgg,
    totalSalesPaidAgg,
    totalPurchasesAgg,
    totalPurchasesPaidAgg,
    lowStockResult,
    expiringSoonCount,
  ] = await Promise.all([
    prisma.sale.aggregate({
      where: { shopId, date: { gte: todayStart, lte: todayEnd } },
      _sum: { totalAmount: true },
    }),
    prisma.payment.aggregate({
      where: {
        shopId,
        type: "CUSTOMER_PAYMENT",
        date: { gte: todayStart, lte: todayEnd },
      },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: { shopId, date: { gte: todayStart, lte: todayEnd } },
      _sum: { amount: true },
    }),
    prisma.sale.aggregate({ where: { shopId }, _sum: { totalAmount: true } }),
    prisma.paymentAllocation.aggregate({
      where: { sale: { shopId } },
      _sum: { amount: true },
    }),
    prisma.purchase.aggregate({
      where: { shopId },
      _sum: { totalAmount: true },
    }),
    prisma.paymentAllocation.aggregate({
      where: { purchase: { shopId } },
      _sum: { amount: true },
    }),
    // Column-vs-column comparison isn't expressible in Prisma's `where`,
    // so this one query is raw SQL. Parameterized — safe from injection.
    prisma.$queryRaw`
      SELECT COUNT(*)::int AS count
      FROM "Product"
      WHERE "shopId" = ${shopId} AND "isActive" = true AND quantity <= "minQuantityAlert"
    `,
    prisma.product.count({
      where: {
        shopId,
        isActive: true,
        expiryDate: { gte: todayStart, lte: expiringCutoff },
      },
    }),
  ]);

  const salesToday = Number(salesTodayAgg._sum.totalAmount ?? 0);
  const moneyReceivedToday = Number(moneyReceivedTodayAgg._sum.amount ?? 0);

  return {
    sales: salesToday,
    moneyReceived: moneyReceivedToday,
    // Approximation: today's sales not covered by today's customer
    // payments. Not exact if a payment today settles an older sale, or a
    // sale made today gets paid off tomorrow — good enough for a daily
    // at-a-glance number, not for accounting reconciliation.
    creditSales: Math.max(salesToday - moneyReceivedToday, 0),
    customersOwe:
      Number(totalSalesAgg._sum.totalAmount ?? 0) -
      Number(totalSalesPaidAgg._sum.amount ?? 0),
    suppliersOwe:
      Number(totalPurchasesAgg._sum.totalAmount ?? 0) -
      Number(totalPurchasesPaidAgg._sum.amount ?? 0),
    lowStock: lowStockResult[0].count,
    expiringSoon: expiringSoonCount,
    expenses: Number(expensesTodayAgg._sum.amount ?? 0),
  };
}

export default { getDashboard };
