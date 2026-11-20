/** @vitest-environment happy-dom */

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TakeRecorder } from "@/components/student/take-recorder";
import { renderWithIntl } from "@/test/render";

class FakeRecorder {
  static instances: FakeRecorder[] = [];
  state: "inactive" | "recording" = "inactive";
  mimeType: string;
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  static isTypeSupported() {
    return true;
  }
  constructor(
    public stream: MediaStream,
    options?: { mimeType?: string },
  ) {
    this.mimeType = options?.mimeType ?? "video/webm";
    FakeRecorder.instances.push(this);
  }
  start() {
    this.state = "recording";
  }
  stop() {
    this.state = "inactive";
    this.ondataavailable?.({ data: new Blob(["frame"], { type: this.mimeType }) });
    this.onstop?.();
  }
}

function fakeStream() {
  const stop = vi.fn();
  const track = { stop };
  const stream = {
    getTracks: () => [track, track],
    getVideoTracks: () => [track],
    getAudioTracks: () => [track],
  } as unknown as MediaStream;
  return { stream, stop };
}

function setup(getUserMedia: () => Promise<MediaStream>) {
  Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia } });
  vi.stubGlobal("MediaRecorder", FakeRecorder);
  Object.defineProperty(HTMLMediaElement.prototype, "srcObject", { configurable: true, writable: true, value: null });
  URL.createObjectURL = vi.fn(() => "blob:take");
  URL.revokeObjectURL = vi.fn();
  const onTake = vi.fn();
  renderWithIntl(<TakeRecorder kind="practice" maxSeconds={90} onTake={onTake} />, ["student"]);
  return onTake;
}

describe("TakeRecorder", () => {
  beforeEach(() => {
    FakeRecorder.instances = [];
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not ask for the camera until the student opens it", async () => {
    const getUserMedia = vi.fn(async () => fakeStream().stream);
    setup(getUserMedia);

    expect(getUserMedia).not.toHaveBeenCalled();
    await userEvent.setup().click(await screen.findByRole("button", { name: "Open camera" }));
    expect(getUserMedia).toHaveBeenCalledTimes(1);
    expect(FakeRecorder.instances).toHaveLength(0);
    expect(screen.getByRole("button", { name: "Start recording" })).toBeTruthy();
  });

  it("records only after Start, then reviews before attaching", async () => {
    const user = userEvent.setup();
    const { stream } = fakeStream();
    const onTake = setup(async () => stream);

    await user.click(await screen.findByRole("button", { name: "Open camera" }));
    await user.click(screen.getByRole("button", { name: "Start recording" }));
    expect(FakeRecorder.instances).toHaveLength(1);
    expect(screen.getByRole("status").textContent).toContain("Recording");

    await user.click(screen.getByRole("button", { name: "Stop recording" }));
    expect(onTake).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Use this take" })).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Use this take" }));
    expect(onTake).toHaveBeenCalledTimes(1);
    const file = onTake.mock.calls[0][0] as File;
    expect(file.name).toBe("practice.webm");
  });

  it("goes back to the preview on Record again and clears the take", async () => {
    const user = userEvent.setup();
    const onTake = setup(async () => fakeStream().stream);

    await user.click(await screen.findByRole("button", { name: "Open camera" }));
    await user.click(screen.getByRole("button", { name: "Start recording" }));
    await user.click(screen.getByRole("button", { name: "Stop recording" }));
    await user.click(screen.getByRole("button", { name: "Record again" }));

    expect(onTake).toHaveBeenCalledWith(null);
    expect(await screen.findByRole("button", { name: "Start recording" })).toBeTruthy();
  });

  it("shows a message when the camera is denied", async () => {
    const user = userEvent.setup();
    setup(async () => {
      throw new DOMException("denied", "NotAllowedError");
    });

    await user.click(await screen.findByRole("button", { name: "Open camera" }));
    expect((await screen.findByRole("alert")).textContent).toContain("blocked");
    expect(screen.getByRole("button", { name: "Open camera" })).toBeTruthy();
  });

  it("stops the camera when cancelled", async () => {
    const user = userEvent.setup();
    const { stream, stop } = fakeStream();
    const onTake = setup(async () => stream);

    await user.click(await screen.findByRole("button", { name: "Open camera" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(stop).toHaveBeenCalled();
    expect(onTake).toHaveBeenCalledWith(null);
    expect(screen.getByRole("button", { name: "Open camera" })).toBeTruthy();
  });

  it("deletes a take from review and from the attached state", async () => {
    const user = userEvent.setup();
    const onTake = setup(async () => fakeStream().stream);

    await user.click(await screen.findByRole("button", { name: "Open camera" }));
    await user.click(screen.getByRole("button", { name: "Start recording" }));
    await user.click(screen.getByRole("button", { name: "Stop recording" }));
    await user.click(screen.getByRole("button", { name: "Use this take" }));
    await user.click(screen.getByRole("button", { name: "Delete this take" }));

    expect(onTake).toHaveBeenLastCalledWith(null);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:take");
    expect(screen.getByRole("button", { name: "Open camera" })).toBeTruthy();
  });
});
