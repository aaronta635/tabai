/** @vitest-environment happy-dom */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ActiveClass, StudioShell } from "@/components/studio-shell";
import { ThemeToggle } from "@/components/theme-toggle";
import { DeleteTakeButton } from "@/components/teacher/delete-take-button";
import { ParaIcon } from "@/components/ui/para-icon";

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router, usePathname: () => "/vi/student/work/song1", useSearchParams: () => new URLSearchParams("q=gam") }));
vi.mock("@/app/teacher/actions", () => ({ deleteTeacherTake: vi.fn() }));
vi.mock("@/lib/supabase/client", () => ({
  createBrowserSupabase: () => ({ auth: { signOut: vi.fn(async () => ({ error: null })) } }),
}));
const shell = { name: "Student A", home: "/student", kicker: "Practice room", items: [{ href: "/student/work", label: "Assigned work", icon: "assignment" as const }], menuLinks: [{ href: "/student/profile", label: "Profile" }], labels: { signOut: "Sign out", menu: "Menu", close: "Close", themeLight: "Light", themeDark: "Dark" } };
beforeEach(() => {
  sessionStorage.setItem("howl0-session-bound", "1");
  router.push.mockReset(); router.refresh.mockReset();
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); delete document.documentElement.dataset.theme; });

it("retains locale-aware selection, profile, logout and main's active class context", async () => {
  const user = userEvent.setup(); const signOut = vi.fn(async () => {});
  const view = render(<StudioShell {...shell} variant="student" signOutAction={signOut}><ActiveClass name="Class A" /></StudioShell>);
  expect(screen.getByRole("link", { name: "Assigned work" })).toHaveAttribute("href", "/student/work");
  expect(screen.getByRole("link", { name: "Assigned work" })).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("link", { name: /Student A Profile/ })).toHaveAttribute("href", "/student/profile");
  expect(screen.queryByRole("searchbox")).toBeNull();
  expect(view.container.querySelector(".studio-active-class")).toHaveTextContent("Class A");
  await user.click(screen.getByRole("button", { name: "Sign out" }));
  await waitFor(() => expect(signOut).toHaveBeenCalledOnce());
});

it("student theme controls retain the cookie endpoint, pending state and router refresh", async () => {
  const user = userEvent.setup();
  let finish: (value: Response) => void = () => {};
  const response = new Promise<Response>((resolve) => { finish = resolve; });
  const fetchMock = vi.fn(() => response); vi.stubGlobal("fetch", fetchMock);
  render(<ThemeToggle variant="student" theme="light" labels={{ light: "Light", dark: "Dark" }} />);
  await user.click(screen.getByRole("button", { name: "Dark" }));
  expect(document.documentElement.dataset.theme).toBe("dark");
  expect(fetchMock).toHaveBeenCalledWith("/api/theme", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ theme: "dark" }) });
  expect(screen.getByRole("button", { name: "Dark" })).toBeDisabled();
  finish(new Response(null, { status: 200 }));
  await waitFor(() => expect(router.refresh).toHaveBeenCalledOnce());
});

it("an icon-enhanced delete still requires confirmation and calls the supplied owner action", async () => {
  const user = userEvent.setup(); const remove = vi.fn(async () => {});
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  render(<DeleteTakeButton submissionId="synthetic-take" label="Delete" confirmLabel="Confirm delete" afterHref="/student/takes" remove={remove} icon={<ParaIcon name="trash" />} />);
  await user.click(screen.getByRole("button", { name: "Delete" }));
  expect(confirm).toHaveBeenCalledWith("Confirm delete"); expect(remove).not.toHaveBeenCalled();
  confirm.mockReturnValue(true);
  await user.click(screen.getByRole("button", { name: "Delete" }));
  await waitFor(() => expect(remove).toHaveBeenCalledWith("synthetic-take"));
  expect(router.push).toHaveBeenCalledWith("/student/takes");
});
