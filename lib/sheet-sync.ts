import { alignWithShift, pitchDistance } from "@/lib/align";
import { isMusicXmlPath, parseMusicXml, type ScoreNote } from "@/lib/musicxml";
import type { HeardPitchNote } from "@/lib/pitch-overlay";
import { type SheetSyncJson, type SheetSyncPoint } from "@/lib/score-model";

const MATCH_RATIO = 0.5;

export function weakSheetSync(expected: number, matched: number, error: string): SheetSyncJson {
  return {
    version: "sheet-sync-v1",
    confidence: "weak",
    points: [],
    matched,
    expected,
    error: error.slice(0, 200),
  };
}

/** Before the first anchor and after the last, the cursor holds that bar. */
export function mediaFollow(t: number, points: SheetSyncPoint[]): "follow" | { holdBar: number } {
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) return { holdBar: 1 };
  if (t < first.t) return { holdBar: first.bar };
  if (t > last.t) return { holdBar: last.bar };
  return "follow";
}

export function buildSheetSync(notes: ScoreNote[], heard: HeardPitchNote[]): SheetSyncJson {
  const expected = notes.length;
  if (expected === 0) return weakSheetSync(0, 0, "no notes in the sheet");
  if (heard.length === 0) return weakSheetSync(expected, 0, "no tutorial pitch");

  const aligned = alignWithShift(
    notes.map((note) => ({ midi: note.midi })),
    heard.map((note) => ({ midi: note.midi })),
  );
  const matches: Array<{ bar: number; beat: number; t: number }> = [];
  for (const step of aligned.steps) {
    if (step.heardIndex == null) continue;
    const note = notes[step.expectedIndex];
    const got = heard[step.heardIndex];
    if (!note || !got) continue;
    if (pitchDistance(note.midi + aligned.shift, got.midi) > 1) continue;
    matches.push({ bar: note.bar, beat: note.beat, t: got.tStart });
  }
  if (matches.length / expected < MATCH_RATIO) {
    return weakSheetSync(expected, matches.length, "too few matches");
  }

  const byBar = new Map<number, { beat: number; t: number }>();
  for (const match of matches) {
    const previous = byBar.get(match.bar);
    if (!previous || match.beat < previous.beat || (match.beat === previous.beat && match.t < previous.t)) {
      byBar.set(match.bar, { beat: match.beat, t: match.t });
    }
  }
  const points: SheetSyncPoint[] = [...byBar.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([bar, value]) => ({ bar, beat: 0, t: value.t }));
  for (let index = 1; index < points.length; index++) {
    if (points[index].t <= points[index - 1].t) {
      return weakSheetSync(expected, matches.length, "bar times go backwards");
    }
  }
  if (points.length === 0) return weakSheetSync(expected, matches.length, "no bar anchors");
  return {
    version: "sheet-sync-v1",
    confidence: "ok",
    points,
    matched: matches.length,
    expected,
  };
}

/** Null when pitch did not run or the sheet is not MusicXML. A parse failure is weak. */
export function sheetSyncForAssets(input: {
  sheetPath: string;
  sheetXml: string | null;
  pitchNotes: HeardPitchNote[] | null;
}): SheetSyncJson | null {
  if (!input.pitchNotes || !input.sheetXml || !isMusicXmlPath(input.sheetPath)) return null;
  try {
    return buildSheetSync(parseMusicXml(input.sheetXml), input.pitchNotes);
  } catch (error) {
    return weakSheetSync(0, 0, error instanceof Error ? error.message : "sheet sync failed");
  }
}
