import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { expect, it, vi } from "vitest";
import en from "@/messages/en.json";
import StudentPiecePage from "./page";

const fixture = vi.hoisted(() => ({ canSubmit: false }));
vi.mock("@/lib/auth", () => ({ readStudentSession: async () => ({ id: "student-a", name: "Student A" }) }));
vi.mock("@/lib/i18n", () => ({ getLocale: async () => "en", getMessages: async () => en }));
vi.mock("@/lib/prisma", () => ({ prisma: { submission: { findMany: async () => [] } } }));
vi.mock("@/lib/piece-view", () => ({
  loadPieceClassroom: async () => ({
    canSubmit: fixture.canSubmit,
    needsProfile: false,
    bound: { student: { id: "student-a" }, otherClass: false },
    assigned: { dueAt: null, goal: "Synthetic goal" },
    piece: { title: "Exercise A", teacher: { name: "Teacher A" }, description: "Assignment instructions A", note: null, tips: "Practice tip A", dueAt: null, goal: null },
    tutorialUrl: null, clipUrl: null, sheetUrl: null, sheetKind: "file", sheetSync: null,
  }),
}));

async function pageHtml() {
  const content = await StudentPiecePage({ params: Promise.resolve({ code: "example" }) });
  return renderToStaticMarkup(createElement(NextIntlClientProvider, { locale: "en", timeZone: "UTC", messages: en, children: content }));
}

it("retains the existing canSubmit visibility condition for assignment context and the upload desk", async () => {
  fixture.canSubmit = false;
  const blocked = await pageHtml();
  expect(blocked).not.toContain("Assignment instructions A");
  expect(blocked).not.toContain("Practice tip A");
  expect(blocked).not.toContain('class="student-upload');

  fixture.canSubmit = true;
  const allowed = await pageHtml();
  expect(allowed).toContain("Assignment instructions A");
  expect(allowed).toContain("Practice tip A");
  expect(allowed).toContain('class="student-upload');
  fixture.canSubmit = false;
});
