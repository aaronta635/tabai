/** @vitest-environment happy-dom */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PieceCodeForm } from "@/components/landing/piece-code-form";
import { mockRouter } from "@/test/setup";

describe("PieceCodeForm", () => {
  it("does not navigate on an empty code", async () => {
    const user = userEvent.setup();
    render(<PieceCodeForm placeholder="Class code" submit="Join" />);

    await user.click(screen.getByRole("button", { name: "Join" }));
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it("opens a trimmed lowercase class path", async () => {
    const user = userEvent.setup();
    render(<PieceCodeForm placeholder="Class code" submit="Join" />);

    await user.type(screen.getByLabelText("Class code"), "  SONG1 ");
    await user.click(screen.getByRole("button", { name: "Join" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/c/song1");
  });
});
