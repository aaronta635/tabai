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

  it("shows the piece brief and waits for a video before sending", () => {
    renderWithIntl(
      <StudentUpload
        code="song1"
        needsProfile={false}
        desk={{
          pieceTitle: "Easy 1",
          teacherName: "Lan",
          brief: "Bars 1–8, slowly.",
          tips: null,
          meta: "Due Friday",
        }}
      />,
      ["student"],
    );

    expect(screen.getByRole("button", { name: "Send to teacher" })).toBeDisabled();
    expect(screen.getByText("Bars 1–8, slowly.")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Note to teacher" })).toBeInTheDocument();
    expect(screen.getByText("Drop a recording here")).toBeInTheDocument();
  });

  it("tells a take from a practice take", async () => {
    const user = userEvent.setup();
    renderWithIntl(<StudentUpload code="song1" needsProfile={false} />, ["student"]);
    expect(screen.getByText("Your teacher watches this and replies.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Send a practice take" }));
    expect(screen.getByText("Saved as practice. No reply.")).toBeInTheDocument();
  });
});

it("student mode choices preserve the note and selected file without sending or exposing unsupported overdub", async () => {
  const user = userEvent.setup();
  const desk = { pieceTitle: "Exercise A", teacherName: "Teacher A", brief: "Instructions", tips: null, meta: null };
  const view = renderWithIntl(<StudentUpload variant="studio" code="song1" needsProfile={false} desk={desk} />, ["student"]);
  expect(screen.getByRole("button", { name: "Send to teacher" })).toBeDisabled();
  expect(screen.queryByRole("button", { name: "Record over teacher's clip" })).toBeNull();
  await user.type(screen.getByRole("textbox", { name: "Note to teacher" }), "Keep this note");
  await user.upload(screen.getByLabelText("Browse files"), new File(["video"], "take.webm", { type: "video/webm" }));
  await user.click(screen.getByRole("button", { name: "Send a practice take", pressed: false }));
  expect(screen.getByRole("button", { name: "Send a practice take", pressed: true })).toHaveAttribute("type", "button");
  expect(screen.getByRole("button", { name: "Send a take" })).toHaveAttribute("aria-pressed", "false");
  expect(screen.getByRole("textbox", { name: "Note to teacher" })).toHaveValue("Keep this note");
  expect(screen.getByText("take.webm")).toBeInTheDocument();
  expect(view.container.querySelector('button[type="submit"]')).not.toBeDisabled();
  expect(screen.getByText("Saved as practice. No reply.")).toBeInTheDocument();
});

it("offers the existing overdub mode only with a teacher clip and keeps final sending gated on media", async () => {
  const user = userEvent.setup();
  const view = renderWithIntl(
    <StudentUpload variant="studio" code="song1" needsProfile={false} clipUrl="/synthetic-clip.webm"
      desk={{ pieceTitle: "Exercise A", teacherName: "Teacher A", brief: null, tips: null, meta: null }} />,
    ["student"],
  );
  await user.click(screen.getByRole("button", { name: "Record over teacher's clip", pressed: false }));
  expect(screen.getByRole("button", { name: "Record over teacher's clip", pressed: true })).toHaveAttribute("type", "button");
  expect(view.container.querySelector('button[type="submit"]')).toBeDisabled();
});
