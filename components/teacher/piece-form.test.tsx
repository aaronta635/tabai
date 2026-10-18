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
    await user.click(screen.getByRole("button", { name: "Add piece" }));

    expect(await screen.findByText("Enter a piece title.")).toBeInTheDocument();
    expect(createPieceRecord).not.toHaveBeenCalled();
  });
});
