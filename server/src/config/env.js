import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

const envFiles =
  process.env.NODE_ENV === "production"
    ? [".env", ".env.development"]
    : [".env.development", ".env"];

for (const file of envFiles) {
  const filePath = path.resolve(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    dotenv.config({ path: filePath, override: false });
  }
}

const required = [
  "DATABASE_URL",
  "JWT_ACCESS_SECRET",
  "JWT_ACCESS_EXPIRES_IN",
  "REFRESH_TOKEN_EXPIRES_DAYS",
  "CHAPA_SECRET_KEY",
  "CHAPA_WEBHOOK_SECRET",
  "CHAPA_CALLBACK_URL",
  "CHAPA_RETURN_URL",
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

export const env = {
  port: Number(process.env.PORT) || 4000,
  databaseUrl: process.env.DATABASE_URL,
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN, // e.g. "15m"
  },
  refreshToken: {
    expiresDays: Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS), // e.g. 30
  },
  trial: {
    days: Number(process.env.TRIAL_DAYS) || 14,
  },
  chapa: {
    secretKey: process.env.CHAPA_SECRET_KEY,
    webhookSecret: process.env.CHAPA_WEBHOOK_SECRET,
    callbackUrl: process.env.CHAPA_CALLBACK_URL,
    returnUrl: process.env.CHAPA_RETURN_URL,
  },
  billing: {
    monthlyPriceEtb: Number(process.env.MONTHLY_PRICE_ETB) || 1000,
    // AI fallback for payments the owner hasn't reviewed by hand:
    // after this many minutes the AI gets one shot at auto-verifying.
    autoAiMinutes: Number(process.env.AUTO_AI_MINUTES) || 15,
    // Confidence (0..1) the AI must reach to auto-approve/auto-reject.
    // Below this it stays PENDING for a human decision.
    autoAiThreshold: Number(process.env.AUTO_AI_THRESHOLD) || 0.8,
    schedulerEnabled: process.env.SCHEDULER_ENABLED !== "false",
    schedulerIntervalSeconds: Number(process.env.SCHEDULER_INTERVAL_SECONDS) || 60,
  },
  ai: {
    provider: process.env.AI_PROVIDER || "stub", // "stub" | "openai"
    openaiApiKey: process.env.OPENAI_API_KEY,
    openaiModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
  },
  admin: {
    // Used only by prisma/seed.js to create the first platform-owner admin.
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    name: process.env.ADMIN_NAME || "Platform Admin",
  },
};

export default env;
