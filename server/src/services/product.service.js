import prisma from "../lib/prisma.js";
import ApiError from "../utils/apiError.js";

export async function listProducts(shopId, query) {
  const { search, category, lowStock, expiringWithinDays, page, limit } = query;

  const where = {
    shopId,
    isActive: true,
    ...(category ? { category } : {}),
    ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
    ...(expiringWithinDays
      ? {
          expiryDate: {
            lte: new Date(
              Date.now() + expiringWithinDays * 24 * 60 * 60 * 1000,
            ),
          },
        }
      : {}),
  };

  // lowStock (quantity <= minQuantityAlert) can't be expressed as a plain
  // column-vs-column filter in the Prisma where clause, so it's applied
  // after the fetch. Fine at V1 scale; move to a raw query if this ever
  // needs to run against a huge catalog with pagination.
  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  const filtered = lowStock
    ? items.filter((p) => Number(p.quantity) <= Number(p.minQuantityAlert))
    : items;

  return { items: filtered, total, page, limit };
}

export async function getOwnedProduct(shopId, productId) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.shopId !== shopId)
    throw ApiError.notFound("Product not found");
  return product;
}

export async function getProduct(shopId, productId) {
  return getOwnedProduct(shopId, productId);
}

export async function createProduct(shopId, data) {
  const { quantity, ...rest } = data;

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: { shopId, quantity, ...rest },
    });

    // Record the starting quantity as a stock movement so the product's
    // history always fully explains its current quantity from zero.
    if (Number(quantity) > 0) {
      await tx.stockMovement.create({
        data: {
          shopId,
          productId: product.id,
          type: "ADJUSTMENT",
          quantity,
          note: "Initial stock on product creation",
        },
      });
    }

    return product;
  });
}

export async function updateProduct(shopId, productId, data) {
  await getOwnedProduct(shopId, productId);
  return prisma.product.update({ where: { id: productId }, data });
}

export async function deactivateProduct(shopId, productId) {
  await getOwnedProduct(shopId, productId);
  await prisma.product.update({
    where: { id: productId },
    data: { isActive: false },
  });
}

export default {
  listProducts,
  getProduct,
  getOwnedProduct,
  createProduct,
  updateProduct,
  deactivateProduct,
};
