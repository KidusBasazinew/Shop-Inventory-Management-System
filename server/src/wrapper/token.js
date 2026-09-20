import jwt from "jsonwebtoken";
import crypto from "node:crypto";

import { env } from "../config/env.js";

// ---------- Access token (short-lived JWT, stateless) ----------

function signAccessToken(user) {
  return jwt.sign(
    { userId: user.id, shopId: user.shopId, role: user.role },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessExpiresIn },
  );
}

function verifyAccessToken(token) {
  // Throws if invalid/expired — callers should catch this.
  return jwt.verify(token, env.jwt.accessSecret);
}

// ---------- Refresh token (opaque random string, stored hashed) ----------
//
// Deliberately NOT a JWT. An opaque token gives us instant, unconditional
// revocation (delete/flag the DB row) without needing a blacklist — a JWT
// refresh token is valid until it expires no matter what the DB says unless
// you build that blacklist anyway. Only the SHA-256 hash is stored, so a
// leaked database dump doesn't hand out usable refresh tokens.

function generateRefreshToken() {
  const raw = crypto.randomBytes(48).toString("hex");
  const hash = hashRefreshToken(raw);
  const expiresAt = new Date(
    Date.now() + env.refreshToken.expiresDays * 24 * 60 * 60 * 1000,
  );
  return { raw, hash, expiresAt };
}

function hashRefreshToken(raw) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export {
  signAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashRefreshToken,
};
