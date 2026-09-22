/** @vitest-environment happy-dom */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthForm } from "@/components/auth/auth-form";
import { mockRouter } from "@/test/setup";

const signInWithPassword = vi.fn();
const signInWithOAuth = vi.fn();
const signOut = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createBrowserSupabase: () => ({
    auth: {
      signInWithPassword,
      signInWithOAuth,
      signOut,
      signUp: vi.fn(),
      getSession: vi.fn(),
    },
  }),
}));

const labels = {
  email: "Email",
  password: "Password",
  signIn: "Sign in",
  signUp: "Create account",
  checkEmail: "Check email",
  wrongRoleTutor: "This email is a teacher account. Sign in as a teacher.",
  wrongRoleStudent: "This email is a student account. Sign in as a student.",
  continueGoogle: "Continue with Google",
  continueFacebook: "Continue with Facebook",
  continueZalo: "Continue with Zalo",
  orEmail: "or email",
  providerFailed: "That sign-in did not start.",
};

describe("AuthForm", () => {
  beforeEach(() => {
    signInWithPassword.mockReset();
    signInWithOAuth.mockReset();
    signOut.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("does not open a teacher session from student sign-in", async () => {
    signInWithPassword.mockResolvedValue({ error: null });
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "role_mismatch", actual: "tutor" }),
    } as Response);

    const user = userEvent.setup();
    render(<AuthForm role="student" next="/student" labels={labels} />);

    await user.type(screen.getByLabelText("Email"), "teacher@studio.test");
    await user.type(screen.getByLabelText("Password"), "secret1");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText(labels.wrongRoleTutor)).toBeInTheDocument();
    expect(signOut).toHaveBeenCalled();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it("starts Google, Facebook, and Zalo from the same bars", async () => {
    signInWithOAuth.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    const cases = [
      ["Continue with Google", "google"],
      ["Continue with Facebook", "facebook"],
      ["Continue with Zalo", "custom:zalo"],
    ] as const;

    for (const [name] of cases) {
      const view = render(<AuthForm role="student" next="/student" labels={labels} />);
      await user.click(screen.getByRole("button", { name }));
      view.unmount();
    }

    expect(signInWithOAuth).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        provider: "google",
        options: expect.objectContaining({ skipBrowserRedirect: true }),
      }),
    );
    expect(signInWithOAuth).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ provider: "facebook" }),
    );
    expect(signInWithOAuth).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ provider: "custom:zalo" }),
    );
  });
});
