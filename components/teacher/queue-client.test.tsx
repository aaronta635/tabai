/** @vitest-environment happy-dom */

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueueClient, type QueueItem } from "@/components/teacher/queue-client";
import { renderWithIntl } from "@/test/render";

const sendReply = vi.fn();
const markOpened = vi.fn();

vi.mock("@/app/teacher/actions", () => ({
  approveStudent: vi.fn(),
  markOpened: (...args: unknown[]) => markOpened(...args),
  sendReply: (...args: unknown[]) => sendReply(...args),
  skipSubmission: vi.fn(),
  togglePick: vi.fn(),
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
});
