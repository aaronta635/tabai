import { afterEach, describe, expect, it, vi } from "vitest";
import { API_WAIT_MS, GEMINI_VIDEO_WAIT_MS } from "@/lib/constants";
import { remainingServiceWaitMs, serviceWaitTimedOut, withServiceWait } from "@/lib/service-wait";

afterEach(() => {
  vi.useRealTimers();
});

describe("service wait", () => {
  it("uses the budget passed in, not a shared minute", () => {
    const start = new Date("2026-11-20T00:00:00.000Z");
    expect(serviceWaitTimedOut(start, API_WAIT_MS, start.getTime() + API_WAIT_MS - 1)).toBe(false);
    expect(serviceWaitTimedOut(start, API_WAIT_MS, start.getTime() + API_WAIT_MS)).toBe(true);
    expect(serviceWaitTimedOut(start, GEMINI_VIDEO_WAIT_MS, start.getTime() + 60_000)).toBe(false);
    expect(remainingServiceWaitMs(start.getTime(), API_WAIT_MS, start.getTime() + 5_000)).toBe(10_000);
  });

  it("fails a hung service call after that call's wait", async () => {
    vi.useFakeTimers();
    const hung = withServiceWait(new Promise(() => {}), "gemini json", GEMINI_VIDEO_WAIT_MS);
    const expectTimeout = expect(hung).rejects.toThrow(`gemini json timed out after ${GEMINI_VIDEO_WAIT_MS}ms`);
    await vi.advanceTimersByTimeAsync(GEMINI_VIDEO_WAIT_MS);
    await expectTimeout;
  });
});
