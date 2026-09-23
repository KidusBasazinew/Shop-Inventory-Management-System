import prisma from "../lib/prisma.js";
import ApiError from "../utils/apiError.js";

export async function listPurchases(
  shopId,
  { supplierId, status, page, limit },
) {
  const where = {
    shopId,
    ...(supplierId ? { supplierId } : {}),
    ...(status ? { status } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.purchase.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        supplier: { select: { id: true, name: true } },
        items: { include: { product: { select: { id: true, name: true } } } },
      },
    }),
    prisma.purchase.count({ where }),
  ]);

  const items = await Promise.all(
    rows.map(async (p) => {
      const agg = await prisma.paymentAllocation.aggregate({
        where: { purchaseId: p.id },
        _sum: { amount: true },
      });
      return { ...p, amountPaid: Number(agg._sum.amount ?? 0) };
    }),
  );

  return { items, total, page, limit };
}

export async function getPurchase(shopId, purchaseId) {
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: {
      supplier: true,
      items: { include: { product: { select: { id: true, name: true } } } },
      allocations: { include: { payment: true } },
    },
  });
  if (!purchase || purchase.shopId !== shopId)
    throw ApiError.notFound("Purchase not found");

  const paid = purchase.allocations.reduce(
    (sum, a) => sum + Number(a.amount),
    0,
  );
  return {
    ...purchase,
    amountPaid: paid,
    balance: Number(purchase.totalAmount) - paid,
  };
}

export async function createPurchase(shopId, { supplierId, date, items }) {
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
  });
  if (!supplier || supplier.shopId !== shopId)
    throw ApiError.notFound("Supplier not found");

  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, shopId },
  });
  if (products.length !== new Set(productIds).size) {
    throw ApiError.badRequest(
      "One or more products were not found in this shop",
    );
  }

  const itemsWithSubtotal = items.map((i) => ({
    ...i,
    subtotal: i.quantity * i.unitCost,
  }));
  const totalAmount = itemsWithSubtotal.reduce((sum, i) => sum + i.subtotal, 0);

  return prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.create({
      data: {
        shopId,
        supplierId,
        date: date ?? new Date(),
        totalAmount,
        status: "UNPAID",
        items: { create: itemsWithSubtotal },
      },
      include: { items: true },
    });

    // Receiving goods increases stock — one movement per line item, all
    // pointing back at this purchase for a full audit trail.
    for (const item of itemsWithSubtotal) {
      await tx.product.update({
        where: { id: item.productId },
        data: { quantity: { increment: item.quantity } },
      });
      await tx.stockMovement.create({
        data: {
          shopId,
          productId: item.productId,
          type: "PURCHASE",
          quantity: item.quantity,
          purchaseId: purchase.id,
          note: `Purchase from ${supplier.name}`,
        },
      });
    }

    return purchase;
  });
}

export default { listPurchases, getPurchase, createPurchase };
