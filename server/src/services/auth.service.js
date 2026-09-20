import prisma from "../lib/prisma.js";
import ApiError from "../utils/apiError.js";
import { hashPassword, comparePassword } from "../wrapper/password.js";
import {
  signAccessToken,
  generateRefreshToken,
  hashRefreshToken,
} from "../wrapper/token.js";
import { env } from "../config/env.js";

function sanitizeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

/**
 * Issues a fresh access + refresh token pair for a user, persisting the
 * refresh token (hashed) so it can be looked up and revoked later.
 */
async function issueTokenPair(user, tx = prisma) {
  const accessToken = signAccessToken(user);
  const { raw, hash, expiresAt } = generateRefreshToken();

  await tx.refreshToken.create({
    data: {
      shopId: user.shopId,
      userId: user.id,
      tokenHash: hash,
      expiresAt,
    },
  });

  return { accessToken, refreshToken: raw };
}

async function register({
  shopName,
  shopLocation,
  ownerName,
  phone,
  password,
}) {
  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing)
    throw ApiError.conflict("An account with this phone number already exists");

  const passwordHash = await hashPassword(password);
  const trialEnd = new Date(Date.now() + env.trial.days * 24 * 60 * 60 * 1000);

  const { shop, owner } = await prisma.$transaction(
    async (tx) => {
      const shop = await tx.shop.create({
        data: {
          name: shopName,
          location: shopLocation,
          phone,
          ownerName,
          trialEnd,
        },
      });

      const owner = await tx.user.create({
        data: {
          shopId: shop.id,
          name: ownerName,
          phone,
          passwordHash,
          role: "OWNER",
        },
      });
      return { shop, owner };
    },
    { timeout: 15000 }, // ms — default is 5000
  );

  const tokens = await issueTokenPair(owner);
  return { shop, user: sanitizeUser(owner), ...tokens };
}

async function login({ phone, password }) {
  const user = await prisma.user.findUnique({
    where: { phone },
    include: { shop: true },
  });

  // Same message whether the phone doesn't exist or the password is wrong —
  // never reveal which one it was, that's an account enumeration leak.
  if (!user || !user.isActive)
    throw ApiError.unauthorized("Invalid phone number or password");

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) throw ApiError.unauthorized("Invalid phone number or password");

  if (user.shop.subscriptionStatus === "EXPIRED") {
    throw ApiError.paymentRequired("This shop's subscription has expired");
  }

  const tokens = await issueTokenPair(user);
  return { user: sanitizeUser(user), shop: user.shop, ...tokens };
}

async function refresh({ refreshToken }) {
  const tokenHash = hashRefreshToken(refreshToken);

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw ApiError.unauthorized("Refresh token is invalid or expired");
  }

  if (!stored.user.isActive) {
    throw ApiError.unauthorized("Account is deactivated");
  }

  // Rotate: revoke the used token and issue a brand new pair. If a revoked
  // token is ever presented again, that's a signal it was stolen/replayed —
  // production hardening: revoke the whole session family on reuse.
  const [, tokens] = await prisma.$transaction(async (tx) => {
    const revoke = tx.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });
    const pair = issueTokenPair(stored.user, tx);
    return Promise.all([revoke, pair]);
  });

  return tokens;
}

async function logout({ refreshToken }) {
  const tokenHash = hashRefreshToken(refreshToken);

  // Idempotent on purpose — logging out with an already-invalid token
  // should not error, the end state the caller wants is already true.
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export { register, login, refresh, logout, issueTokenPair, sanitizeUser };
