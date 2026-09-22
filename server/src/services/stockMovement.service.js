import prisma from "../lib/prisma.js";

export async function listStockMovements(
  shopId,
  { type, productId, from, to, page, limit },
) {
  const where = {
    shopId,
    ...(type ? { type } : {}),
    ...(productId ? { productId } : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        product: { select: { id: true, name: true, unitType: true } },
        createdBy: { select: { id: true, name: true } },
      },
    }),
    prisma.stockMovement.count({ where }),
  ]);

  return { items, total, page, limit };
}

export default { listStockMovements };
