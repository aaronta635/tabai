/** @vitest-environment happy-dom */

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { StudentUpload } from "@/components/student/upload-form";
import { renderWithIntl } from "@/test/render";

function stubVideoDuration() {
  if (!URL.createObjectURL) {
    URL.createObjectURL = () => "blob:test";
  }
  if (!URL.revokeObjectURL) {
    URL.revokeObjectURL = () => {};
  }
  Object.defineProperty(HTMLMediaElement.prototype, "src", {
    configurable: true,
    set(this: HTMLMediaElement, value: string) {
      this.setAttribute("src", String(value));
      queueMicrotask(() => {
        Object.defineProperty(this, "duration", { configurable: true, value: 5 });
        this.dispatchEvent(new Event("loadedmetadata"));
      });
    },
    get(this: HTMLMediaElement) {
      return this.getAttribute("src") ?? "";
    },
  });
}

describe("StudentUpload", () => {
  beforeEach(() => {
    stubVideoDuration();
  });

  it("asks for a video before profile fields", async () => {
    const user = userEvent.setup();
    renderWithIntl(<StudentUpload code="song1" needsProfile />, ["student"]);

    await user.type(screen.getByRole("textbox", { name: "Name" }), "An");
    await user.type(screen.getByPlaceholderText("Zalo number"), "0909");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("Choose a video first.")).toBeInTheDocument();
  });

  it("flags whitespace name and contact after a file is chosen", async () => {
    const user = userEvent.setup();
    renderWithIntl(<StudentUpload code="song1" needsProfile />, ["student"]);

    const file = new File(["video"], "take.webm", { type: "video/webm" });
    await user.upload(screen.getByLabelText("Choose video"), file);
    await user.type(screen.getByRole("textbox", { name: "Name" }), "   ");
    await user.type(screen.getByPlaceholderText("Zalo number"), "   ");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("Enter a name.")).toBeInTheDocument();
    expect(screen.getByText("Enter a Zalo number or Messenger link.")).toBeInTheDocument();
  });

  it("tells a take from a practice take", async () => {
    const user = userEvent.setup();
    renderWithIntl(<StudentUpload code="song1" needsProfile={false} />, ["student"]);
    expect(screen.getByText("Your teacher watches this and replies.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Send a practice take" }));
    expect(screen.getByText("Saved as practice. No reply.")).toBeInTheDocument();
  });
});
