/** @vitest-environment happy-dom */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FilePicker } from "@/components/file-picker";

describe("FilePicker", () => {
  it("calls onFile with the chosen file", async () => {
    const user = userEvent.setup();
    const onFile = vi.fn();
    render(
      <FilePicker accept="video/*" buttonLabel="Choose video" changeLabel="Change" file={null} onFile={onFile} />,
    );

    const file = new File(["x"], "take.webm", { type: "video/webm" });
    await user.upload(screen.getByLabelText("Choose video"), file);
    expect(onFile).toHaveBeenCalledWith(file);
  });
});
