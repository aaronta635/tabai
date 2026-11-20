/** @vitest-environment happy-dom */

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { PracticeClipCard, PracticeSession } from "@/components/student/practice-session";
import { PITCH_CHECK_WAIT_MS } from "@/lib/constants";
import { renderWithIntl } from "@/test/render";
import type { StudentPitchClip } from "@/lib/student-pitch";

const sendPracticeToTeacher = vi.hoisted(() => vi.fn());
vi.mock("@/app/student/actions", () => ({ sendPracticeToTeacher }));

const clip: StudentPitchClip = {
  id: "sub-1",
  kind: "practice",
  submittedAt: "2026-11-20T00:00:00.000Z",
  job: { status: "done", attempts: 1, lastError: null, updatedAt: "2026-11-20T00:01:00.000Z" },
  notes: [{ tStart: 1, tEnd: 1.2, midi: 60, name: "C4" }],
  pitchError: null,
  pitchJudge: "ok",
  tempoBpm: 80,
  issues: [],
  log: { kind: "ready", line: "", detail: null, open: false },
};

it("opens a full-screen practice session with an explicit exit", () => {
  renderWithIntl(
    <PracticeSession
      code="song1"
      title="Exercise A"
      tutorialUrl={null}
      clipUrl={null}
      sheetUrl={null}
      sheetKind="file"
      sheetSync={null}
      clips={[]}
    />,
    ["student"],
  );
  expect(screen.getByRole("link", { name: "Leave practice" })).toHaveAttribute("href", "/student/work/song1");
  expect(screen.getByRole("heading", { name: "Exercise A" })).toBeInTheDocument();
});

afterEach(() => {
  vi.useRealTimers();
});

it("stops the pitch wait after one minute and lets them send", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-20T00:01:00.000Z"));
  const waiting: StudentPitchClip = {
    ...clip,
    submittedAt: "2026-11-20T00:00:00.000Z",
    job: { status: "running", attempts: 1, lastError: null, updatedAt: "2026-11-20T00:00:01.000Z" },
    notes: [],
    log: { kind: "running", line: "Checking pitch… Attempt 1.", detail: null, open: true },
  };
  renderWithIntl(<PracticeClipCard clip={waiting} onSent={vi.fn()} />, ["student"]);
  expect(screen.getByText("Pitch check is taking too long. You can send this to your teacher, or record again.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Send this to teacher" })).not.toBeDisabled();
  expect(PITCH_CHECK_WAIT_MS).toBe(60_000);
});

it("sends a chosen practice clip to the teacher without recording again", async () => {
  const user = userEvent.setup();
  sendPracticeToTeacher.mockResolvedValueOnce({ ok: true, id: "sub-1", already: false, pieceCode: "song1" });
  const onSent = vi.fn();
  renderWithIntl(<PracticeClipCard clip={clip} onSent={onSent} />, ["student"]);
  await user.click(screen.getByRole("button", { name: "Send this to teacher" }));
  expect(sendPracticeToTeacher).toHaveBeenCalledWith("sub-1");
  expect(onSent).toHaveBeenCalledWith({ ...clip, kind: "take" });
  expect(screen.getByText("Sent to teacher")).toBeInTheDocument();
});
