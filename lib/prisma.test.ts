import { describe, expect, it } from "vitest";
import { prismaConnectionLimit, runtimeDatasourceUrl, withPrismaPoolParams } from "@/lib/prisma-pool";

describe("prismaConnectionLimit", () => {
  it("defaults to 6 and caps at 10", () => {
    expect(prismaConnectionLimit(undefined)).toBe(6);
    expect(prismaConnectionLimit("")).toBe(6);
    expect(prismaConnectionLimit("2")).toBe(2);
    expect(prismaConnectionLimit("0")).toBe(6);
    expect(prismaConnectionLimit("99")).toBe(10);
  });
});

describe("withPrismaPoolParams", () => {
  it("adds a small pool onto a session URI", () => {
    expect(withPrismaPoolParams("postgresql://u:p@host:5432/postgres", 3)).toBe(
      "postgresql://u:p@host:5432/postgres?connection_limit=3&pool_timeout=10&connect_timeout=8",
    );
  });

  it("keeps an explicit limit already on the URI", () => {
    expect(
      withPrismaPoolParams("postgresql://u:p@host:5432/postgres?connection_limit=1", 3),
    ).toBe(
      "postgresql://u:p@host:5432/postgres?connection_limit=1&pool_timeout=10&connect_timeout=8",
    );
  });
});

describe("runtimeDatasourceUrl", () => {
  it("prefers the transaction pooler over session mode", () => {
    expect(
      runtimeDatasourceUrl(
        "postgresql://u:p@host:6543/postgres?pgbouncer=true",
        "postgresql://u:p@host:5432/postgres",
      ),
    ).toBe(
      "postgresql://u:p@host:6543/postgres?pgbouncer=true&connection_limit=6&pool_timeout=10&connect_timeout=8",
    );
  });

  it("adds pgbouncer on a bare 6543 URI", () => {
    expect(runtimeDatasourceUrl("postgresql://u:p@host:6543/postgres")).toContain("pgbouncer=true");
  });
});
