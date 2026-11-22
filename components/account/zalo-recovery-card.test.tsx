/** @vitest-environment happy-dom */

import type { User } from "@supabase/supabase-js";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZaloRecoveryCard, type ZaloRecoveryLabels } from "@/components/account/zalo-recovery-card";
import { ZALO_RECOVERY_DISMISS_KEY } from "@/lib/zalo-account-recovery";

const updateUser = vi.fn();
const linkIdentity = vi.fn();
const getUser = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createBrowserSupabase: () => ({
    auth: { updateUser, linkIdentity, getUser },
  }),
}));

vi.mock("@/lib/service-wait", () => ({
  fetchWithServiceWait: vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 })),
}));

const labels: ZaloRecoveryLabels = {
  title: "Keep your PARA account",
  body: "You signed in with Zalo.",
  studentHint: "Parent email is fine.",
  email: "Email",
  password: "New password",
  confirmPassword: "Type the password again",
  saveEmail: "Save email and password",
  linkGoogle: "Link Google",
  or: "or",
  dismiss: "Not now",
  checkEmail: "Check your email",
  saved: "Saved",
  errors: {
    emailTaken: "Email taken",
    weakPassword: "Weak password",
    invalidEmail: "Invalid email",
    passwordMismatch: "Password mismatch",
    linkingDisabled: "Linking disabled",
    generic: "Something went wrong",
  },
};

const zaloUser = {
  id: "auth-1",
  email: "zalo_99@oauth.para.local",
  identities: [],
  app_metadata: {},
} as User;

describe("ZaloRecoveryCard", () => {
  beforeEach(() => {
    sessionStorage.clear();
    updateUser.mockReset();
    linkIdentity.mockReset();
    getUser.mockReset();
    getUser.mockResolvedValue({ data: { user: zaloUser } });
    Object.defineProperty(window, "location", {
      value: { origin: "http://localhost:3000", pathname: "/student", assign: vi.fn() },
      writable: true,
    });
  });

  it("shows when recovery is needed", async () => {
    render(<ZaloRecoveryCard role="student" showInitially labels={labels} />);
    expect(await screen.findByRole("heading", { name: labels.title })).toBeInTheDocument();
  });

  it("hides after dismiss for this session", async () => {
    const user = userEvent.setup();
    render(<ZaloRecoveryCard role="student" showInitially labels={labels} />);
    await user.click(await screen.findByRole("button", { name: labels.dismiss }));
    expect(screen.queryByRole("heading", { name: labels.title })).not.toBeInTheDocument();
    expect(sessionStorage.getItem(ZALO_RECOVERY_DISMISS_KEY)).toBe("1");
  });

  it("calls updateUser on the current session", async () => {
    const user = userEvent.setup();
    updateUser.mockResolvedValue({
      data: { user: { ...zaloUser, email: "kid@example.com" } },
      error: null,
    });
    render(<ZaloRecoveryCard role="student" showInitially labels={labels} />);
    await user.type(screen.getByLabelText(labels.email), "kid@example.com");
    await user.type(screen.getByLabelText(labels.password), "secret1");
    await user.type(screen.getByLabelText(labels.confirmPassword), "secret1");
    await user.click(screen.getByRole("button", { name: labels.saveEmail }));
    await waitFor(() => expect(updateUser).toHaveBeenCalledTimes(1));
    expect(updateUser.mock.calls[0]?.[0]).toEqual({
      email: "kid@example.com",
      password: "secret1",
    });
  });

  it("uses linkIdentity for Google", async () => {
    const user = userEvent.setup();
    linkIdentity.mockResolvedValue({ data: { url: "https://accounts.google.com/o/oauth2" }, error: null });
    render(<ZaloRecoveryCard role="teacher" showInitially labels={labels} />);
    await user.click(await screen.findByRole("button", { name: labels.linkGoogle }));
    await waitFor(() => expect(linkIdentity).toHaveBeenCalledTimes(1));
    expect(linkIdentity.mock.calls[0]?.[0]?.provider).toBe("google");
  });

  it("shows linking-disabled copy", async () => {
    const user = userEvent.setup();
    linkIdentity.mockResolvedValue({ data: null, error: { message: "Manual linking is disabled" } });
    render(<ZaloRecoveryCard role="student" showInitially labels={labels} />);
    await user.click(await screen.findByRole("button", { name: labels.linkGoogle }));
    expect(await screen.findByText(labels.errors.linkingDisabled)).toBeInTheDocument();
  });

  it("stays hidden when no recovery is needed", async () => {
    getUser.mockResolvedValue({
      data: { user: { ...zaloUser, email: "kid@example.com", identities: [{ provider: "email" }] } },
    });
    render(<ZaloRecoveryCard role="student" showInitially labels={labels} />);
    await waitFor(() => expect(screen.queryByRole("heading", { name: labels.title })).not.toBeInTheDocument());
  });
});