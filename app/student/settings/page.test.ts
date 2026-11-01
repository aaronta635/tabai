import { expect, it, vi } from "vitest";
import StudentSettingsPage from "./page";
import { deleteStudentAccount } from "@/app/account/actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { isValidElement, type ReactElement } from "react";
import en from "@/messages/en.json";

vi.mock("@/lib/auth", () => ({ readStudentSession: async () => ({ id: "student-a", name: "Student A" }) }));
vi.mock("@/lib/i18n", () => ({ getLocale: async () => "en", getMessages: async () => en }));
vi.mock("@/lib/theme", () => ({ getTheme: async () => "light" }));
vi.mock("@/app/account/actions", () => ({ deleteStudentAccount: vi.fn(async () => {}) }));
function descendants(node: unknown): ReactElement<Record<string, unknown>>[] {
  if (Array.isArray(node)) return node.flatMap(descendants);
  if (!isValidElement<Record<string, unknown>>(node)) return [];
  return [node, ...descendants(node.props.children)];
}
it("retains main's account-deletion confirmation and action alongside student appearance controls", async () => {
  const nodes = descendants(await StudentSettingsPage());
  const form = nodes.find(node => node.type === "form");
  expect(form?.props.action).toBe(deleteStudentAccount);
  const confirm = nodes.find(node => node.type === "input" && node.props.name === "confirm");
  expect(confirm?.props).toMatchObject({ type: "checkbox", required: true, value: "yes" });
  expect(nodes.find(node => node.type === ThemeToggle)?.props).toMatchObject({ variant: "student", theme: "light" });
});
