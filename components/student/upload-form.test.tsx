/** @vitest-environment happy-dom */

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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


afterEach(() => vi.unstubAllGlobals());

it.each(["take", "practice", "overdub"] as const)("studio %s submits the existing signed-upload contract and prevents a second pending send", async (kind) => {
  stubVideoDuration();
  const user = userEvent.setup();
  let finish: (value: Response) => void = () => {};
  const pending = new Promise<Response>((resolve) => { finish = resolve; });
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ signedUrl: "http://127.0.0.1/synthetic-upload", mediaId: "synthetic-media" })))
    .mockResolvedValueOnce(new Response(null, { status: 200 }))
    .mockReturnValueOnce(pending);
  vi.stubGlobal("fetch", fetchMock);
  const view = renderWithIntl(<StudentUpload variant="studio" code="song1" needsProfile={false} clipUrl="/synthetic-clip.webm"
    desk={{ pieceTitle: "Exercise A", teacherName: "Teacher A", brief: null, tips: null, meta: null }} />, ["student"]);
  const file = new File(["synthetic video"], "take.webm", { type: "video/webm" });
  await user.upload(screen.getByLabelText("Browse files"), file);
  await user.type(screen.getByRole("textbox", { name: "Note to teacher" }), "Synthetic note — thử lại");
  if (kind !== "take") await user.click(screen.getByRole("button", { name: kind === "practice" ? "Send a practice take" : "Record over teacher's clip", pressed: false }));
  const send = view.container.querySelector('button[type="submit"]') as HTMLButtonElement;
  await user.click(send);
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
  expect(send).toBeDisabled();
  expect(send).toHaveAttribute("aria-busy", "true");
  expect(await screen.findByRole("status")).toHaveTextContent("Saving the take…");
  expect(view.container.querySelector(".send-pick")).toBeTruthy();
  expect(view.container.querySelectorAll(".send-strings span")).toHaveLength(6);
  await user.click(send);
  expect(fetchMock).toHaveBeenCalledTimes(3);
  expect(fetchMock.mock.calls[0][0]).toBe("/api/l/song1/upload-url");
  expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ size: file.size, contentType: "video/webm" });
  expect(fetchMock.mock.calls[1]).toEqual(["http://127.0.0.1/synthetic-upload", { method: "PUT", headers: { "Content-Type": "video/webm" }, body: file }]);
  expect(fetchMock.mock.calls[2][0]).toBe("/api/l/song1/complete");
  expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toEqual({ mediaId: "synthetic-media", kind, note: "Synthetic note — thử lại" });
  finish(new Response(JSON.stringify({ error: "Synthetic retry error" }), { status: 500 }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Synthetic retry error");
  await waitFor(() => expect(send).not.toBeDisabled());
  expect(screen.getByRole("textbox", { name: "Note to teacher" })).toHaveValue("Synthetic note — thử lại");
});
