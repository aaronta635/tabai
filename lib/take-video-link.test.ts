/** @vitest-environment happy-dom */

import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchTakeVideo, prefetchTakeVideos, readTakeVideo } from "@/lib/take-video-link";

afterEach(() => {
  sessionStorage.clear();
  vi.unstubAllGlobals();
});

describe("take video links", () => {
  it("reuses a stored link and skips another request", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ url: "https://media.example/take.webm" }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    expect(await fetchTakeVideo("media-1")).toBe("https://media.example/take.webm");
    expect(readTakeVideo("media-1")).toBe("https://media.example/take.webm");
    expect(await fetchTakeVideo("media-1")).toBe("https://media.example/take.webm");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("prefetches the visible ids in one request", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      expect(url).toContain("mediaId=a");
      expect(url).toContain("mediaId=b");
      return {
        ok: true,
        json: async () => ({
          urls: {
            a: "https://media.example/a.webm",
            b: "https://media.example/b.webm",
          },
        }),
      };
    });
    vi.stubGlobal("fetch", fetchMock);

    await prefetchTakeVideos(["a", "a", "b"]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(readTakeVideo("a")).toBe("https://media.example/a.webm");
    expect(readTakeVideo("b")).toBe("https://media.example/b.webm");
  });
});
