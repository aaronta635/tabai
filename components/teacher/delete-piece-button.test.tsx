/** @vitest-environment happy-dom */

import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DeletePieceButton } from "@/components/teacher/delete-piece-button";
import { renderWithIntl } from "@/test/render";

describe("DeletePieceButton", () => {
  it("shows a warning and waits for a second confirmation", async () => {
    const user = userEvent.setup();
    const remove = vi.fn().mockResolvedValue(undefined);
    renderWithIntl(
      <DeletePieceButton
        pieceId="piece-1"
        label="Delete piece"
        confirmLabel="Students can no longer open it."
        remove={remove}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Delete piece" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent("Students can no longer open it.");
    expect(remove).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Keep piece" }));
    expect(remove).not.toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete piece" }));
    const warning = await screen.findByRole("alertdialog");
    await user.click(within(warning).getByRole("button", { name: "Delete piece" }));
    expect(remove).toHaveBeenCalledWith("piece-1");
  });
});