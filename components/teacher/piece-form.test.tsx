/** @vitest-environment happy-dom */

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PieceForm } from "@/components/teacher/piece-form";
import { renderWithIntl } from "@/test/render";

const createPieceRecord = vi.fn();

vi.mock("@/app/teacher/actions", () => ({
  createPieceRecord: (...args: unknown[]) => createPieceRecord(...args),
  completePieceAssets: vi.fn(),
  updatePieceAssignment: vi.fn(),
}));

describe("PieceForm", () => {
  beforeEach(() => {
    createPieceRecord.mockReset();
  });

  it("shows an inline title error for a space-only name", async () => {
    const user = userEvent.setup();
    renderWithIntl(<PieceForm />);

    await user.clear(screen.getByLabelText("Piece title"));
    await user.type(screen.getByLabelText("Piece title"), "   ");
    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(await screen.findByText("Enter a piece title.")).toBeInTheDocument();
    expect(createPieceRecord).not.toHaveBeenCalled();
  });

  it("walks key, tuning, and the existing deadline before creating the piece", async () => {
    const user = userEvent.setup();
    createPieceRecord.mockResolvedValue({ id: "piece-1", code: "abcde" });
    renderWithIntl(<PieceForm />);

    await user.type(screen.getByLabelText("Piece title"), "Prelude");
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Pick a key." }));
    await user.click(screen.getByRole("option", { name: "G" }));
    await user.click(screen.getByRole("button", { name: "Major" }));
    await user.click(screen.getByRole("option", { name: "Minor" }));
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Pick a tuning." }));
    await user.click(screen.getByRole("option", { name: /Standard/ }));
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByRole("button", { name: "Add piece" })).toBeInTheDocument();
    expect(createPieceRecord).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Add piece" }));

    expect(createPieceRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Prelude",
        songKey: "G minor",
        tuning: "standard",
      }),
    );
  });
});
