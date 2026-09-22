import { PrismaClient } from "@prisma/client";
import { loadLocalEnv } from "./load-env";

loadLocalEnv();

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const datasourceUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    ...(datasourceUrl ? { datasources: { db: { url: datasourceUrl } } } : {}),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

let reconnecting: Promise<void> | null = null;

/** Drop a dead engine socket and open a new one. Safe to call concurrently. */
export async function reconnectPrisma() {
  if (reconnecting) return reconnecting;
  reconnecting = (async () => {
    try {
      await prisma.$disconnect();
    } catch {
      // already closed
    }
    await prisma.$connect();
  })().finally(() => {
    reconnecting = null;
  });
  return reconnecting;
}
