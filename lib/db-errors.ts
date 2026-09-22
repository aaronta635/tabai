import { Prisma } from "@prisma/client";

const CONNECTION_CODES = new Set(["P1001", "P1002", "P1008", "P1011", "P1017"]);

export function isPrismaConnectionError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return CONNECTION_CODES.has(error.code);
  }
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }
  const message = error instanceof Error ? error.message : String(error);
  return /closed the connection|Can't reach database|Engine is not yet connected|kind: Closed|Connection reset/i.test(
    message,
  );
}
