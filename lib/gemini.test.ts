import type { GoogleGenAI } from "@google/genai";
import { describe, expect, it, vi } from "vitest";
import { deleteGeminiFile, discardLateGeminiUpload, uploadGeminiFile } from "@/lib/gemini";

vi.mock("@/lib/service-wait", () => ({
  withServiceWait: vi.fn(async (work: Promise<unknown>) => work),
  remainingServiceWaitMs: () => 60_000,
}));

describe("uploadGeminiFile", () => {
  it("does not pass upload httpOptions so SDK keeps resumable upload defaults", async () => {
    const upload = vi.fn().mockResolvedValue({
      name: "files/x",
      uri: "https://example/x",
      mimeType: "video/mp4",
      state: "ACTIVE",
    });
    const ai = { files: { upload, get: vi.fn() } } as unknown as GoogleGenAI;

    await uploadGeminiFile(ai, Buffer.from("abc"), "video/mp4", "clip");

    expect(upload).toHaveBeenCalledWith({
      file: expect.any(Blob),
      config: { mimeType: "video/mp4", displayName: "clip" },
    });
    const config = upload.mock.calls[0]?.[0]?.config as { httpOptions?: unknown } | undefined;
    expect(config?.httpOptions).toBeUndefined();
  });
});

describe("discardLateGeminiUpload", () => {
  it("deletes a file when the upload resolves after the caller timed out", async () => {
    const del = vi.fn().mockResolvedValue(undefined);
    const ai = { files: { delete: del } } as unknown as GoogleGenAI;
    let resolve!: (value: { name: string }) => void;
    const uploadWork = new Promise<{ name: string }>((r) => {
      resolve = r;
    });

    const pending = discardLateGeminiUpload(ai, uploadWork);
    resolve({ name: "files/late" });
    await pending;

    expect(del).toHaveBeenCalledWith({ name: "files/late" });
  });
});