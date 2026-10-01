import prisma from "../lib/prisma.js";
import ApiError from "../utils/apiError.js";
import {
  cloudinaryEnabled,
  uploadProductPhotoBuffer,
  destroyImage,
  publicIdFromUrl,
} from "./cloudinary.service.js";

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
      include: { preferredSupplier: { select: { id: true, name: true } } },
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
  const { quantity, supplierId, ...rest } = data;

  if (supplierId) {
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });
    if (!supplier || supplier.shopId !== shopId)
      throw ApiError.notFound("Supplier not found");
  }

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: { shopId, quantity, preferredSupplierId: supplierId, ...rest },
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
  const existing = await getOwnedProduct(shopId, productId);
  const { supplierId, ...rest } = data;

  if (supplierId) {
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });
    if (!supplier || supplier.shopId !== shopId)
      throw ApiError.notFound("Supplier not found");
  }

  // Clearing the photo (photoUrl: null) should not leave the old
  // Cloudinary asset behind burning storage.
  if (rest.photoUrl === null && existing.photoUrl) {
    await destroyImage(publicIdFromUrl(existing.photoUrl));
  }

  return prisma.product.update({
    where: { id: productId },
    data: {
      ...rest,
      ...(supplierId !== undefined ? { preferredSupplierId: supplierId } : {}),
    },
  });
}

export async function deactivateProduct(shopId, productId) {
  await getOwnedProduct(shopId, productId);
  await prisma.product.update({
    where: { id: productId },
    data: { isActive: false },
  });
}

/**
 * Attach or replace a product photo.
 *
 * The buffer is resized + compressed by Cloudinary before storage (see
 * uploadProductPhotoBuffer), so a high-resolution phone camera photo
 * costs ~100 KB of storage instead of several MB. Any previous asset is
 * deleted first so replacing a photo never accumulates orphans.
 */
export async function setProductPhoto(shopId, productId, file) {
  const product = await getOwnedProduct(shopId, productId);
  if (!file) throw ApiError.badRequest("Product photo is required");
  if (!cloudinaryEnabled) {
    throw ApiError.badRequest(
      "Image storage is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.",
    );
  }

  if (product.photoUrl) {
    await destroyImage(publicIdFromUrl(product.photoUrl));
  }

  const uploaded = await uploadProductPhotoBuffer(file.buffer, { shopId });
  return prisma.product.update({
    where: { id: productId },
    data: { photoUrl: uploaded.url },
  });
}

export default {
  listProducts,
  getProduct,
  getOwnedProduct,
  createProduct,
  updateProduct,
  deactivateProduct,
  setProductPhoto,
};
