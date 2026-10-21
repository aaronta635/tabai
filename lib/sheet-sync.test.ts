import { describe, expect, it } from "vitest";
import { parseMusicXml } from "@/lib/musicxml";
import { buildSheetSync, mediaFollow, sheetSyncForAssets } from "@/lib/sheet-sync";
import { parseSheetSync } from "@/lib/score-model";

const FIXTURE = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>2</divisions>
        <time><beats>4</beats><beat-type>4</beat-type></time>
      </attributes>
      <note>
        <pitch><step>C</step><octave>4</octave></pitch>
        <duration>2</duration>
      </note>
      <note>
        <chord/>
        <pitch><step>E</step><octave>4</octave></pitch>
        <duration>2</duration>
      </note>
      <note>
        <rest/>
        <duration>2</duration>
      </note>
      <note>
        <pitch><step>D</step><octave>4</octave></pitch>
        <duration>2</duration>
      </note>
    </measure>
    <measure number="2">
      <note>
        <pitch><step>F</step><octave>4</octave></pitch>
        <duration>2</duration>
      </note>
      <backup><duration>2</duration></backup>
      <note>
        <pitch><step>A</step><octave>4</octave></pitch>
        <duration>2</duration>
      </note>
    </measure>
  </part>
</score-partwise>`;

describe("parseMusicXml", () => {
  it("keeps chord tones on the same onset and a second voice on the beat", () => {
    expect(parseMusicXml(FIXTURE)).toEqual([
      { bar: 1, beat: 0, midi: 60 },
      { bar: 1, beat: 0, midi: 64 },
      { bar: 1, beat: 2, midi: 62 },
      { bar: 2, beat: 0, midi: 65 },
      { bar: 2, beat: 0, midi: 69 },
    ]);
  });

  it("counts a tie once", () => {
    const xml = `<?xml version="1.0"?>
      <score-partwise>
        <part id="P1"><measure number="1">
          <attributes><divisions>1</divisions></attributes>
          <note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><tie type="start"/></note>
          <note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><tie type="stop"/></note>
          <note><pitch><step>E</step><alter>1</alter><octave>4</octave></pitch><duration>1</duration></note>
        </measure></part>
      </score-partwise>`;
    expect(parseMusicXml(xml)).toEqual([
      { bar: 1, beat: 0, midi: 60 },
      { bar: 1, beat: 2, midi: 65 },
    ]);
  });
});

describe("buildSheetSync", () => {
  it("anchors each bar at the first matched tutorial time", () => {
    const sync = buildSheetSync(parseMusicXml(FIXTURE), [
      { tStart: 0.5, tEnd: 1, midi: 60 },
      { tStart: 0.5, tEnd: 1, midi: 64 },
      { tStart: 2, tEnd: 2.5, midi: 62 },
      { tStart: 4, tEnd: 4.5, midi: 65 },
      { tStart: 4, tEnd: 4.5, midi: 69 },
    ]);
    expect(sync).toMatchObject({
      version: "sheet-sync-v1",
      confidence: "ok",
      matched: 5,
      expected: 5,
      points: [
        { bar: 1, beat: 0, t: 0.5 },
        { bar: 2, beat: 0, t: 4 },
      ],
    });
    expect(mediaFollow(0, sync.points)).toEqual({ holdBar: 1 });
    expect(mediaFollow(2, sync.points)).toBe("follow");
    expect(mediaFollow(5, sync.points)).toEqual({ holdBar: 2 });
  });

  it("returns weak for a long unmatched gap or a backwards map", () => {
    const gap = buildSheetSync(
      [60, 62, 64, 65, 67, 69, 71, 72].map((midi, index) => ({ bar: index + 1, beat: 0, midi })),
      [
        { tStart: 1, tEnd: null, midi: 60 },
        { tStart: 2, tEnd: null, midi: 64 },
      ],
    );
    expect(gap.confidence).toBe("weak");
    expect(gap.points).toEqual([]);

    const backwards = buildSheetSync(
      [60, 62, 64, 65].map((midi, index) => ({ bar: index + 1, beat: 0, midi })),
      [
        { tStart: 8, tEnd: null, midi: 60 },
        { tStart: 6, tEnd: null, midi: 62 },
        { tStart: 4, tEnd: null, midi: 64 },
        { tStart: 2, tEnd: null, midi: 65 },
      ],
    );
    expect(backwards.confidence).toBe("weak");
    expect(backwards.points).toEqual([]);
    expect(backwards.error).toBe("bar times go backwards");
  });
});

describe("sheetSyncForAssets", () => {
  it("stays empty unless pitch ran on a MusicXML sheet", () => {
    expect(sheetSyncForAssets({ sheetPath: "sheet.musicxml", sheetXml: FIXTURE, pitchNotes: null })).toBeNull();
    expect(sheetSyncForAssets({ sheetPath: "sheet.pdf", sheetXml: FIXTURE, pitchNotes: [] })).toBeNull();
    const failed = sheetSyncForAssets({
      sheetPath: "teachers/a/sheet.xml",
      sheetXml: "not music",
      pitchNotes: [],
    });
    expect(failed?.confidence).toBe("weak");
    expect(failed?.points).toEqual([]);
  });
});

describe("parseSheetSync", () => {
  it("drops a ready sync that has no points", () => {
    expect(parseSheetSync({ version: "sheet-sync-v1", confidence: "ok", points: [], matched: 0, expected: 1 })).toBeNull();
    expect(
      parseSheetSync({
        version: "sheet-sync-v1",
        confidence: "weak",
        points: [{ bar: 1, beat: 0, t: 1 }],
        matched: 0,
        expected: 4,
        error: "too few matches",
      })?.points,
    ).toEqual([]);
  });
});
