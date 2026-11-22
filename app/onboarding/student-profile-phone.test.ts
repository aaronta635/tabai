import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaUpdate, requireStudentAccount, claimPhone, getLocale } = vi.hoisted(() => ({
  prismaUpdate: vi.fn(async () => ({
    id: "stu-1",
    name: "An",
    token: "tok",
    authUserId: null,
  })),
  requireStudentAccount: vi.fn(),
  claimPhone: vi.fn(),
  getLocale: vi.fn(async () => "vi" as const),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { student: { update: prismaUpdate } },
}));
vi.mock("@/lib/auth", () => ({
  requireStudentAccount,
  setStudentAccountCookies: vi.fn(async () => {}),
}));
vi.mock("@/lib/student-phone", () => ({ claimPhone }));
vi.mock("@/lib/i18n", () => ({ getLocale }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { updateStudentProfile } from "./actions";

describe("updateStudentProfile phone handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireStudentAccount.mockResolvedValue({
      id: "stu-1",
      name: "An",
      token: "tok",
      authUserId: null,
      ageBand: "under18",
      contactType: "messenger",
      contactHandle: "https://m.me/para.child",
      phoneKey: null,
      answersJson: { playing: "months", work: "song" },
    });
  });

  it("keeps an existing Messenger contact when the phone field is left empty", async () => {
    const form = new FormData();
    form.set("name", "An");
    form.set("ageBand", "under18");
    form.set("playing", "months");
    form.set("work", "song");
    form.set("contactHandle", "   ");

    const result = await updateStudentProfile(form);
    expect(result).toBeUndefined();
    expect(claimPhone).not.toHaveBeenCalled();
    expect(prismaUpdate).toHaveBeenCalledWith({
      where: { id: "stu-1" },
      data: expect.objectContaining({
        contactHandle: "https://m.me/para.child",
        phoneKey: null,
      }),
    });
  });

  it("validates a new phone for a Messenger student who types a number", async () => {
    claimPhone.mockResolvedValue({
      contactHandle: "0912 345 678",
      phoneKey: "84912345678",
    });
    const form = new FormData();
    form.set("name", "An");
    form.set("ageBand", "under18");
    form.set("playing", "months");
    form.set("work", "song");
    form.set("contactHandle", "0912 345 678");

    await updateStudentProfile(form);
    expect(claimPhone).toHaveBeenCalledWith("0912 345 678", "stu-1", "vi");
    expect(prismaUpdate).toHaveBeenCalledWith({
      where: { id: "stu-1" },
      data: expect.objectContaining({
        contactHandle: "0912 345 678",
        phoneKey: "84912345678",
      }),
    });
  });
});