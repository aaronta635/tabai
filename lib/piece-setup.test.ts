import { describe, expect, it } from "vitest";
import { parseSongKey, parseTuning, pieceSetupLabel } from "@/lib/piece-setup";

describe("piece setup", () => {
  it("keeps a tonic and mode, and drops anything else", () => {
    expect(parseSongKey("G major")).toBe("G major");
    expect(parseSongKey("Eb minor")).toBe("Eb minor");
    expect(parseSongKey("H major")).toBeNull();
    expect(parseSongKey("G")).toBeNull();
  });

  it("keeps a known tuning", () => {
    expect(parseTuning("standard")).toBe("standard");
    expect(parseTuning("drop-c")).toBeNull();
  });

  it("labels the key and the string pitches", () => {
    expect(pieceSetupLabel({ songKey: "A minor", tuning: "drop-d" }, "vi")).toBe(
      "A thứ · Drop D · D A D G B E",
    );
    expect(pieceSetupLabel({ songKey: null, tuning: null }, "en")).toBe("");
  });
});
