import { describe, expect, it } from "vitest";
import { mediaStoragePath, sheetView } from "@/lib/media-view";

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
