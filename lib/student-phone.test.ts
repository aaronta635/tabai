import { beforeEach, describe, expect, it, vi } from "vitest";

const findFirst = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: { student: { findFirst } },
}));

import { legacyMisKeyedAuAliases, phoneIsTaken } from "@/lib/student-phone";

describe("legacyMisKeyedAuAliases", () => {
  it("adds the old Vietnamese-key shape for Australian mobile keys", () => {
    expect(legacyMisKeyedAuAliases("61412345678")).toEqual(["61412345678", "84412345678"]);
    expect(legacyMisKeyedAuAliases("84912345678")).toEqual(["84912345678"]);
  });
});

describe("phoneIsTaken", () => {
  beforeEach(() => {
    findFirst.mockReset();
  });

  it("treats a legacy mis-keyed AU row as taken when claiming the correct AU key", async () => {
    findFirst.mockResolvedValueOnce({ id: "other" });
    const taken = await phoneIsTaken("61412345678", "self");
    expect(taken).toBe(true);
    expect(findFirst).toHaveBeenCalledWith({
      where: { phoneKey: { in: ["61412345678", "84412345678"] }, NOT: { id: "self" } },
      select: { id: true },
    });
  });
});