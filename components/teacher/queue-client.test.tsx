/** @vitest-environment happy-dom */

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueueClient, type QueueItem } from "@/components/teacher/queue-client";
import { renderWithIntl } from "@/test/render";

const sendReply = vi.fn();
const markOpened = vi.fn();
const setIssueVerdict = vi.fn();
const peekDraft = vi.fn();
const requestDraft = vi.fn();
const revertReply = vi.fn();

vi.mock("@/app/teacher/actions", () => ({
  approveStudent: vi.fn(),
  markOpened: (...args: unknown[]) => markOpened(...args),
  sendReply: (...args: unknown[]) => sendReply(...args),
  setIssueVerdict: (...args: unknown[]) => setIssueVerdict(...args),
  peekDraft: (...args: unknown[]) => peekDraft(...args),
  requestDraft: (...args: unknown[]) => requestDraft(...args),
  skipSubmission: vi.fn(),
  togglePick: vi.fn(),
  deleteTeacherTake: vi.fn(),
  revertReply: (...args: unknown[]) => revertReply(...args),
}));

const item: QueueItem = {
  id: "sub-1",
  kind: "unanswered",
  studentId: "st-1",
  studentName: "An",
  pieceTitle: "Easy 1",
  waitingMs: 60_000,
  mediaId: null,
  draft: null,
  draftAt: null,
  reply: null,
  teacherPick: false,
  skipReason: null,
  nudgeUrl: null,
  submissionId: "sub-1",
  markers: [],
};

const labels = {
  unanswered: "Unanswered",
  pending: "Pending",
  answered: "Answered",
  practice: "Practice",
};

function renderQueue() {
  return renderWithIntl(
    <QueueClient
      tab="unanswered"
      labels={labels}
      counts={{ unanswered: 1, pending: 0, answered: 0, practice: 0 }}
      items={[item]}
    />,
  );
}

describe("QueueClient", () => {
  beforeEach(() => {
    sendReply.mockReset();
    markOpened.mockReset();
    setIssueVerdict.mockReset();
    peekDraft.mockReset();
    requestDraft.mockReset();
    revertReply.mockReset();
    peekDraft.mockResolvedValue({ text: null, createdAt: null });
    requestDraft.mockResolvedValue({ ok: true, draftQueued: false });
  });

  it("shows an inline error when sending an empty reply", async () => {
    const user = userEvent.setup();
    renderQueue();

    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("Write a reply before sending.")).toBeInTheDocument();
    expect(sendReply).not.toHaveBeenCalled();
  });

  it("shows a stale message instead of sending a second reply", async () => {
    const user = userEvent.setup();
    sendReply.mockResolvedValue({ error: "stale_item" });
    renderQueue();

    await user.type(screen.getByRole("textbox"), "Keep the beat.");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("This take was already answered. Refresh the queue.")).toBeInTheDocument();
    expect(sendReply).toHaveBeenCalledOnce();
  });

  it("lets the tutor mark a timestamped fact without sending the letter", async () => {
    const user = userEvent.setup();
    setIssueVerdict.mockResolvedValue({
      ok: true,
      draftQueued: true,
      latestVerdictAt: "2026-09-29T02:00:00.000Z",
    });
    renderWithIntl(
      <QueueClient
        tab="unanswered"
        labels={labels}
        counts={{ unanswered: 1, pending: 0, answered: 0, practice: 0 }}
        items={[
          {
            ...item,
            markers: [
              {
                index: 0,
                tStart: 5.05,
                type: "pitch",
                label: "0:05 · Am vs C#",
                expected: "Am",
                observed: "C#",
                verdict: null,
                verdictAt: null,
              },
            ],
          },
        ]}
      />,
    );

    expect(screen.getByRole("button", { name: "0:05" })).toBeInTheDocument();
    expect(screen.getByText("Am vs C#")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "True" }));
    expect(setIssueVerdict).toHaveBeenCalledWith({
      submissionId: "sub-1",
      issueIndex: 0,
      verdict: "true",
    });
    expect(sendReply).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Send" })).not.toBeInTheDocument();
    expect(screen.getByText("Writing the letter from the true bars…")).toBeInTheDocument();
  });

  it("hides a premature letter until every fact is marked", () => {
    renderWithIntl(
      <QueueClient
        tab="unanswered"
        labels={labels}
        counts={{ unanswered: 1, pending: 0, answered: 0, practice: 0 }}
        items={[
          {
            ...item,
            draft: "Old letter about a slide the tutor has not checked.",
            draftAt: "2026-09-28T00:00:00.000Z",
            markers: [
              {
                index: 0,
                tStart: 5.05,
                type: "pitch",
                label: "0:05 · G#4 vs A#4",
                expected: "G#4",
                observed: "A#4",
                verdict: null,
                verdictAt: null,
              },
            ],
          },
        ]}
      />,
    );

    expect(screen.queryByDisplayValue(/Old letter/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Send" })).not.toBeInTheDocument();
    expect(screen.getByText("Mark every bar true or false, then the letter is written.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Write it yourself" })).toBeInTheDocument();
  });

  it("opens the letter when the teacher writes it without the fact bars", async () => {
    const user = userEvent.setup();
    sendReply.mockResolvedValue({ ok: true });
    renderWithIntl(
      <QueueClient
        tab="unanswered"
        labels={labels}
        counts={{ unanswered: 1, pending: 0, answered: 0, practice: 0 }}
        items={[
          {
            ...item,
            markers: [
              {
                index: 0,
                tStart: 5.05,
                type: "pitch",
                label: "0:05 · G#4 vs A#4",
                expected: "G#4",
                observed: "A#4",
                verdict: null,
                verdictAt: null,
              },
            ],
          },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Write it yourself" }));
    await user.type(screen.getByRole("textbox"), "Keep the chorus quieter.");
    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(sendReply).toHaveBeenCalledWith({
      submissionId: "sub-1",
      text: "Keep the chorus quieter.",
      grade: null,
    });
  });

  it("takes back a sent reply after confirm", async () => {
    revertReply.mockResolvedValue({ ok: true });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    renderWithIntl(
      <QueueClient
        tab="answered"
        labels={labels}
        counts={{ unanswered: 0, pending: 0, answered: 1, practice: 0 }}
        items={[{ ...item, kind: "answered", reply: "Keep the beat." }]}
      />,
    );

    expect(screen.getByText("Keep the beat.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Take back" }));
    expect(window.confirm).toHaveBeenCalled();
    expect(revertReply).toHaveBeenCalledWith("sub-1");
    vi.mocked(window.confirm).mockRestore();
  });

  it("leaves a sent reply when take-back is cancelled", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    renderWithIntl(
      <QueueClient
        tab="answered"
        labels={labels}
        counts={{ unanswered: 0, pending: 0, answered: 1, practice: 0 }}
        items={[{ ...item, kind: "answered", reply: "Keep the beat." }]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Take back" }));
    expect(revertReply).not.toHaveBeenCalled();
    expect(screen.getByText("Keep the beat.")).toBeInTheDocument();
    vi.mocked(window.confirm).mockRestore();
  });
});
