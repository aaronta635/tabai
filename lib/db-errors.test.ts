import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { isPrismaConnectionError } from "@/lib/db-errors";

describe("isPrismaConnectionError", () => {
  it("matches P1017 closed connections", () => {
    const error = new Prisma.PrismaClientKnownRequestError("Server has closed the connection.", {
      code: "P1017",
      clientVersion: "6.19.3",
    });
    expect(isPrismaConnectionError(error)).toBe(true);
  });

  it("ignores ordinary query errors", () => {
    const error = new Prisma.PrismaClientKnownRequestError("record not found", {
      code: "P2025",
      clientVersion: "6.19.3",
    });
    expect(isPrismaConnectionError(error)).toBe(false);
  });

  it("matches closed-socket messages", () => {
    expect(isPrismaConnectionError(new Error("Error { kind: Closed, cause: None }"))).toBe(true);
  });
});
