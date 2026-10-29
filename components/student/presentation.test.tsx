/** @vitest-environment happy-dom */
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { StudioShell } from "@/components/studio-shell";
import { GroupCard } from "@/components/studio/group-card";
import { PracticeHeatmap } from "@/components/student/practice-heatmap";
import { StudentSessionPanel } from "@/components/schedule/session-panel";
import { WeekCalendar } from "@/components/schedule/week-calendar";
import { renderWithIntl } from "@/test/render";

vi.mock("@/app/teacher/lms-actions", () => ({ saveClassSession: vi.fn() }));
const shell = { name: "Student A", home: "/student", kicker: "Practice room", items: [{ href: "/student", label: "Home", icon: "home" as const }], menuLinks: [], signOutAction: async () => {}, labels: { signOut: "Sign out", menu: "Menu", close: "Close", themeLight: "Light", themeDark: "Dark" } };
beforeEach(() => {
  sessionStorage.setItem("howl0-session-bound", "1");
  Object.defineProperty(window, "matchMedia", { configurable: true, value: () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }) });
});
it("opts into student styling without changing the default teacher shell", async () => {
  const user = userEvent.setup();
  const view = render(<StudioShell {...shell}><p>Page</p></StudioShell>);
  expect(view.container.querySelector(".student-ui")).toBeNull();
  expect(view.container.querySelector("svg use")).toBeNull();
  view.rerender(<StudioShell {...shell} variant="student"><p>Page</p></StudioShell>);
  expect(view.container.querySelector(".student-ui")).toBeTruthy();
  const menu = screen.getByRole("button", { name: "Menu" });
  await user.click(menu);
  expect(screen.getByRole("dialog", { name: "Menu" })).toBeInTheDocument();
  expect(screen.getAllByRole("button", { name: "Close" }).at(-1)).toHaveFocus();
  expect((menu.closest("div.flex-1") as HTMLElement)?.inert).toBe(true);
  const rectangles = vi.spyOn(HTMLElement.prototype, "getClientRects").mockReturnValue([{}] as unknown as DOMRectList);
  const last = within(screen.getByRole("dialog")).getByRole("button", { name: "Sign out" });
  last.focus();
  fireEvent.keyDown(document, { key: "Tab" });
  expect(screen.getAllByRole("button", { name: "Close" }).at(-1)).toHaveFocus();
  fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
  expect(last).toHaveFocus();
  rectangles.mockRestore();
  fireEvent.keyDown(document, { key: "Escape" });
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(menu).toHaveFocus();
  expect(document.body.style.overflow).not.toBe("hidden");
});
it("keeps membership counts without representing them as learning progress", () => {
  const view = render(<GroupCard href="/student/classes/a" title="Class A" chip="Open" meterLabel="Classmates" meterValue="3" meterWidth={100} showMeter={false} actions={[]} />);
  expect(screen.getByText("3")).toBeInTheDocument();
  expect(view.container.querySelector(".meter")).toBeNull();
});
it("gives activity counts and dates equal access without fading text", () => {
  const view = render(<PracticeHeatmap label="Practice · Your videos" locale="vi" days={[{ day: "2026-10-28", count: 2 }, { day: "2026-10-29", count: 0 }]} />);
  expect(screen.getByText("2")).toBeInTheDocument();
  expect(screen.getByText("0")).toBeInTheDocument();
  expect(view.container.querySelector('time[datetime="2026-10-28"]')).toBeTruthy();
  expect(view.container.querySelector("td")?.style.opacity).toBe("");
});
const event = { id: "a", title: "Lesson A", className: "Class A", startsAt: "2026-10-28T10:00:00Z", endsAt: null };
it("keeps read-only student lesson events accessible and connected to the existing handler", async () => {
  const user = userEvent.setup(); const open = vi.fn();
  render(<WeekCalendar locale="en" weekStartIso="2026-10-26T00:00:00Z" events={[event]} readOnly label="Schedule" onSlotClick={vi.fn()} onEventClick={open} />);
  await user.click(screen.getByRole("button", { name: /Lesson A/ }));
  expect(open).toHaveBeenCalledWith(event);
});
it("names the student lesson dialog, closes with Escape and restores focus", async () => {
  const user = userEvent.setup(); const close = vi.fn();
  const trigger = document.createElement("button"); document.body.append(trigger); trigger.focus();
  const view = renderWithIntl(<StudentSessionPanel open onClose={close} event={event} attendance={null} locale="en" />, ["student", "teacher"]);
  const dialog = screen.getByRole("dialog", { name: "Lesson A" });
  fireEvent.keyDown(dialog, { key: "Escape" });
  expect(close).toHaveBeenCalledOnce();
  const buttons = screen.getAllByRole("button", { name: "Close" });
  buttons[buttons.length - 1].focus(); await user.tab(); expect(buttons[buttons.length - 1]).toHaveFocus();
  view.unmount(); expect(trigger).toHaveFocus(); trigger.remove();
});
