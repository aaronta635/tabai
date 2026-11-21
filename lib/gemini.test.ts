import type { GoogleGenAI } from "@google/genai";
import { describe, expect, it, vi } from "vitest";
import { uploadGeminiFile } from "@/lib/gemini";

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