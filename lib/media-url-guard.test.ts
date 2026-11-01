import { describe, expect, it } from "vitest";
import {
  MEDIA_URL_LIMIT,
  MEDIA_URL_MAX_IDS,
  allowMediaUrlLookups,
  mediaIdsFromSearch,
  resetMediaUrlLookups,
} from "@/lib/media-url-guard";

describe("media url guard", () => {
  it("keeps the first page of ids and flags the rest", () => {
    const params = new URLSearchParams();
    for (let i = 0; i < MEDIA_URL_MAX_IDS + 3; i += 1) params.append("mediaId", `m${i}`);
    params.append("mediaId", "m0");

    const parsed = mediaIdsFromSearch(params);

    expect(parsed.ids).toHaveLength(MEDIA_URL_MAX_IDS);
    expect(parsed.ids[0]).toBe("m0");
    expect(parsed.overflow).toBe(true);
  });

  it("stops a teacher who keeps asking", () => {
    resetMediaUrlLookups();
    const now = 1_000_000;
    expect(allowMediaUrlLookups("teacher-1", MEDIA_URL_LIMIT, now)).toBe(true);
    expect(allowMediaUrlLookups("teacher-1", 1, now)).toBe(false);
    expect(allowMediaUrlLookups("teacher-2", 1, now)).toBe(true);
    expect(allowMediaUrlLookups("teacher-1", 1, now + 15_000)).toBe(true);
  });
});
