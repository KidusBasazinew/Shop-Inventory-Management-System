import { PrismaClient } from "@prisma/client";

// A single shared instance. In dev, hot-reload can otherwise spin up a new
// PrismaClient (and a new connection pool) on every file save.
const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
