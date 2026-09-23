import prisma from "../lib/prisma.js";
import ApiError from "../utils/apiError.js";

async function withBalance(shopId, supplier) {
  const [purchaseTotal, paidTotal] = await Promise.all([
    prisma.purchase.aggregate({
      where: { shopId, supplierId: supplier.id },
      _sum: { totalAmount: true },
    }),
    prisma.paymentAllocation.aggregate({
      where: { purchase: { shopId, supplierId: supplier.id } },
      _sum: { amount: true },
    }),
  ]);
  const totalPurchased = Number(purchaseTotal._sum.totalAmount ?? 0);
  const totalPaid = Number(paidTotal._sum.amount ?? 0);
  return {
    ...supplier,
    totalPurchased,
    totalPaid,
    balance: totalPurchased - totalPaid,
  };
}

export async function listSuppliers(shopId, { search, page, limit }) {
  const where = {
    shopId,
    ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.supplier.count({ where }),
  ]);

  const items = await Promise.all(rows.map((s) => withBalance(shopId, s)));
  return { items, total, page, limit };
}

async function getOwnedSupplier(shopId, supplierId) {
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
  });
  if (!supplier || supplier.shopId !== shopId)
    throw ApiError.notFound("Supplier not found");
  return supplier;
}

export async function getSupplier(shopId, supplierId) {
  const supplier = await getOwnedSupplier(shopId, supplierId);
  return withBalance(shopId, supplier);
}

export async function createSupplier(shopId, data) {
  return prisma.supplier.create({ data: { shopId, ...data } });
}

export async function updateSupplier(shopId, supplierId, data) {
  await getOwnedSupplier(shopId, supplierId);
  return prisma.supplier.update({ where: { id: supplierId }, data });
}

export default { listSuppliers, getSupplier, createSupplier, updateSupplier };
