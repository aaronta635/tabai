import { Prisma } from "@prisma/client";

const CONNECTION_CODES = new Set(["P1001", "P1002", "P1008", "P1011", "P1017", "P2024"]);

const CONNECTION_MESSAGE =
  /closed the connection|Can't reach database|Engine is not yet connected|kind: Closed|Connection reset|EMAXCONNSESSION|max clients reached|remaining connection slots|too many clients/i;

export function isPrismaConnectionError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && CONNECTION_CODES.has(error.code)) {
    return true;
  }
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }
  const message = error instanceof Error ? error.message : String(error);
  return CONNECTION_MESSAGE.test(message);
}
