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
    callbackUrl: process.env.CHAPA_CALLBACK_URL, // Chapa calls this after payment — must be your public webhook URL
    returnUrl: process.env.CHAPA_RETURN_URL, // where Chapa's checkout redirects the user's browser/app afterward
  },
  billing: {
    // Placeholder pricing — replace with your actual monthly rate in ETB.
    // No discount tiers yet: 3/12-month plans just multiply this by planMonths.
    monthlyPriceEtb: Number(process.env.MONTHLY_PRICE_ETB) || 1000,
  },
};

export default env;
