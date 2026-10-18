import { describe, expect, it } from "vitest";
import { mediaStoragePath, sheetView, signedMediaTag } from "@/lib/media-view";
import { SIGNED_READ_TTL_SECONDS, SIGNED_URL_CACHE_SECONDS } from "@/lib/storage";

describe("sheetView", () => {
  it("detects images, PDFs, and other files", () => {
    expect(sheetView("teachers/a/sheet.png")).toBe("image");
    expect(sheetView("teachers/a/sheet.PDF")).toBe("pdf");
    expect(sheetView("teachers/a/sheet")).toBe("pdf");
    expect(sheetView("teachers/a/sheet.musicxml")).toBe("file");
  });
});

describe("mediaStoragePath", () => {
  it("reads a storage path and ignores pending-shaped junk", () => {
    expect(mediaStoragePath({ storagePath: "teachers/a/x.pdf" })).toBe("teachers/a/x.pdf");
    expect(mediaStoragePath({ storagePath: 1 })).toBeNull();
    expect(mediaStoragePath(null)).toBeNull();
  });
});

describe("signed media cache", () => {
  it("expires before the signed URL does", () => {
    expect(SIGNED_URL_CACHE_SECONDS).toBe(45 * 60);
    expect(SIGNED_READ_TTL_SECONDS).toBe(60 * 60);
    expect(SIGNED_URL_CACHE_SECONDS).toBeLessThan(SIGNED_READ_TTL_SECONDS);
  });

  it("tags cache entries by storage path", () => {
    expect(signedMediaTag("teachers/a/x.pdf")).toBe("media:teachers/a/x.pdf");
  });
});
