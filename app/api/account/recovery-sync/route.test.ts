import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUser, requireTeacher, requireStudentAccount, updateMany } = vi.hoisted(() => ({
  getUser: vi.fn(),
  requireTeacher: vi.fn(),
  requireStudentAccount: vi.fn(),
  updateMany: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabase: async () => ({ auth: { getUser } }),
}));

vi.mock("@/lib/auth", () => ({
  requireTeacher: (...args: unknown[]) => requireTeacher(...args),
  requireStudentAccount: (...args: unknown[]) => requireStudentAccount(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    teacher: { updateMany },
    student: { updateMany },
  },
}));

import { POST } from "@/app/api/account/recovery-sync/route";

describe("POST /api/account/recovery-sync", () => {
  beforeEach(() => {
    getUser.mockReset();
    requireTeacher.mockReset();
    requireStudentAccount.mockReset();
    updateMany.mockReset();
  });

  it("updates the signed-in student when the auth email is real", async () => {
    getUser.mockResolvedValue({ data: { user: { email: "kid@example.com" } } });
    requireTeacher.mockResolvedValue(null);
    requireStudentAccount.mockResolvedValue({ id: "stu-1" });
    updateMany.mockResolvedValue({ count: 1 });
    const response = await POST();
    expect(response.status).toBe(200);
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: "stu-1", OR: [{ email: null }, { email: { endsWith: "@oauth.para.local" } }] },
      data: { email: "kid@example.com" },
    });
  });

  it("refuses placeholder auth emails", async () => {
    getUser.mockResolvedValue({ data: { user: { email: "zalo_1@oauth.para.local" } } });
    const response = await POST();
    expect(response.status).toBe(400);
    expect(updateMany).not.toHaveBeenCalled();
  });
});