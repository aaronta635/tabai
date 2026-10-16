import { Prisma, PrismaClient } from "@prisma/client";
import { loadLocalEnv } from "./load-env";
import { runtimeDatasourceUrl } from "./prisma-pool";

loadLocalEnv();

function retryConnection(error: unknown) {
  if (error instanceof Prisma.PrismaClientInitializationError) return true;
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P1001" || error.code === "P1002" || error.code === "P1017";
  }
  return false;
}

const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof createPrisma> };

function createPrisma() {
  const datasourceUrl = runtimeDatasourceUrl();
  const base = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    ...(datasourceUrl ? { datasources: { db: { url: datasourceUrl } } } : {}),
  });
  return base.$extends({
    query: {
      async $allOperations({ args, query }) {
        try {
          return await query(args);
        } catch (error) {
          if (!retryConnection(error)) throw error;
          return query(args);
        }
      },
    },
  });
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

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
