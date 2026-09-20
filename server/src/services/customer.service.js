import prisma from "../lib/prisma.js";
import ApiError from "../utils/apiError.js";

async function withBalance(customer) {
  const [saleTotal, paidTotal] = await Promise.all([
    prisma.sale.aggregate({
      where: { shopId: customer.shopId, customerId: customer.id },
      _sum: { totalAmount: true },
    }),
    prisma.paymentAllocation.aggregate({
      where: { sale: { shopId: customer.shopId, customerId: customer.id } },
      _sum: { amount: true },
    }),
  ]);

  const totalPurchased = Number(saleTotal._sum.totalAmount ?? 0);
  const totalPaid = Number(paidTotal._sum.amount ?? 0);

  return {
    ...customer,
    totalPurchased,
    totalPaid,
    balance: totalPurchased - totalPaid, // amount this customer still owes
  };
}

export async function listCustomers(
  shopId,
  { search, hasBalance, page, limit },
) {
  const where = {
    shopId,
    ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.customer.count({ where }),
  ]);

  const items = await Promise.all(rows.map(withBalance));
  const filtered = hasBalance ? items.filter((c) => c.balance > 0) : items;

  return { items: filtered, total, page, limit };
}

async function getOwnedCustomer(shopId, customerId) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });
  if (!customer || customer.shopId !== shopId)
    throw ApiError.notFound("Customer not found");
  return customer;
}

export async function getCustomer(shopId, customerId) {
  const customer = await getOwnedCustomer(shopId, customerId);
  return withBalance(customer);
}

export async function createCustomer(shopId, data) {
  return prisma.customer.create({ data: { shopId, ...data } });
}

export async function updateCustomer(shopId, customerId, data) {
  await getOwnedCustomer(shopId, customerId);
  return prisma.customer.update({ where: { id: customerId }, data });
}

export default { listCustomers, getCustomer, createCustomer, updateCustomer };
