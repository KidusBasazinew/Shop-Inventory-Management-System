import prisma from "../lib/prisma.js";
import ApiError from "../utils/apiError.js";
import { hashPassword } from "../wrapper/password.js";

function sanitize(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

export async function listUsers(shopId) {
  const users = await prisma.user.findMany({
    where: { shopId },
    orderBy: { createdAt: "asc" },
  });
  return users.map(sanitize);
}

export async function createUser(shopId, { fullName, phone, password, role }) {
  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing)
    throw ApiError.conflict("An account with this phone number already exists");

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: { shopId, fullName, phone, passwordHash, role },
  });

  return sanitize(user);
}

async function getOwnedUser(shopId, userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  // Tenant check happens here, not just in the WHERE clause — this is what
  // stops an owner at pharmacy A from editing/deactivating a user at
  // pharmacy B just by guessing a UUID.
  if (!user || user.shopId !== shopId)
    throw ApiError.notFound("User not found");
  return user;
}

export async function updateUser(shopId, targetUserId, actingUserId, data) {
  const target = await getOwnedUser(shopId, targetUserId);

  if (target.role === "OWNER") {
    throw ApiError.forbidden(
      "The pharmacy owner's role cannot be changed here",
    );
  }
  if (targetUserId === actingUserId && data.isActive === false) {
    throw ApiError.badRequest("You cannot deactivate your own account");
  }

  const user = await prisma.user.update({ where: { id: targetUserId }, data });
  return sanitize(user);
}

export async function deactivateUser(shopId, targetUserId, actingUserId) {
  const target = await getOwnedUser(shopId, targetUserId);

  if (target.role === "OWNER") {
    throw ApiError.forbidden(
      "The pharmacy owner's account cannot be deactivated",
    );
  }
  if (targetUserId === actingUserId) {
    throw ApiError.badRequest("You cannot deactivate your own account");
  }

  await prisma.user.update({
    where: { id: targetUserId },
    data: { isActive: false },
  });

  // Deactivating a staff member also kills any live sessions they're
  // holding — otherwise an issued access token stays valid until it expires.
  await prisma.refreshToken.updateMany({
    where: { userId: targetUserId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export default { listUsers, createUser, updateUser, deactivateUser };
