import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseFretRead } from "../lib/fretboard";
import { FRET_RESPONSE_SCHEMA, geminiClient, geminiCompareModel, generateGeminiImageJson } from "../lib/gemini";
import { pitchMismatches, type HeardPitchNote } from "../lib/pitch-overlay";

const FRET_SYSTEM = `You look at one still frame from a guitar lesson.
Find the fretting finger that is pressing the neck.
Count frets from the nut: 0 is open, 1 is the first fret, maximum 15.
Do not name the string.
visible is true only when the fret number is clear. If the hand or the fret is unclear, set visible to false. Do not guess.`;

function noteKey(note: HeardPitchNote) {
  return `${note.tStart}:${note.midi}`;
}

export function grabVideoFrame(videoPath: string, at: number, outPath: string) {
  const result = spawnSync(
    "ffmpeg",
    ["-y", "-ss", Math.max(0, at).toFixed(3), "-i", videoPath, "-frames:v", "1", "-q:v", "4", outPath],
    { stdio: "ignore" },
  );
  return result.status === 0;
}

/** Read a fret for these notes only. Notes that already have a read are left alone. */
export async function labelNoteFrets(videoPath: string, notes: HeardPitchNote[]) {
  const ai = geminiClient();
  const pending = notes.filter((note) => typeof note.visible !== "boolean").slice(0, 8);
  if (!ai || pending.length === 0) return { notes, changed: false };
  const dir = await mkdtemp(join(tmpdir(), "fret-"));
  const labeled = new Map<string, HeardPitchNote>();
  let seen = 0;
  try {
    let index = 0;
    for (const note of pending) {
      index += 1;
      const framePath = join(dir, `note-${index}.jpg`);
      if (!grabVideoFrame(videoPath, note.tStart, framePath)) {
        console.error("fret frame skipped", note.tStart.toFixed(2), "no still");
        continue;
      }
      try {
        const bytes = await readFile(framePath);
        const response = await generateGeminiImageJson({
          ai,
          model: geminiCompareModel(),
          system: FRET_SYSTEM,
          userText: "What fret is the fretting finger on? Do not name the string.",
          imageBase64: bytes.toString("base64"),
          mimeType: "image/jpeg",
          schema: FRET_RESPONSE_SCHEMA,
        });
        const read = parseFretRead(response.data);
        if (read.visible) seen += 1;
        const { string: _string, ...rest } = note;
        labeled.set(noteKey(note), { ...rest, ...read });
        console.log("fret frame", note.tStart.toFixed(2), read.visible ? `ngăn ${read.fret}` : "not visible");
      } catch (error) {
        console.error("fret frame skipped", note.tStart, error instanceof Error ? error.message : error);
      }
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
  console.log("fret labels", `${seen}/${pending.length} visible`);
  if (labeled.size === 0) return { notes, changed: false };
  return {
    notes: notes.map((note) => labeled.get(noteKey(note)) ?? note),
    changed: true,
  };
}

/** Frames only for lick notes whose pitch already disagrees with the tutorial. */
export async function labelMismatchFrets(input: {
  takeVideo: string;
  tutorialVideo: string | null;
  heard: HeardPitchNote[];
  tutorial: HeardPitchNote[];
}) {
  const pairs = pitchMismatches(input.heard, input.tutorial);
  if (pairs.length === 0) return { heard: input.heard, tutorial: input.tutorial, tutorialChanged: false };
  const takeTargets = uniqueNotes(pairs.map((pair) => pair.got));
  const tutorialTargets = uniqueNotes(pairs.map((pair) => pair.want));
  console.log("fret mismatches", pairs.length);
  const heardLabeled = await labelNoteFrets(input.takeVideo, takeTargets);
  const tutorialLabeled = input.tutorialVideo
    ? await labelNoteFrets(input.tutorialVideo, tutorialTargets)
    : { notes: tutorialTargets, changed: false };
  return {
    heard: mergeLabels(input.heard, heardLabeled.notes),
    tutorial: mergeLabels(input.tutorial, tutorialLabeled.notes),
    tutorialChanged: tutorialLabeled.changed,
  };
}

function uniqueNotes(notes: HeardPitchNote[]) {
  const seen = new Set<string>();
  const out: HeardPitchNote[] = [];
  for (const note of notes) {
    const key = noteKey(note);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(note);
  }
  return out;
}

function mergeLabels(all: HeardPitchNote[], labeled: HeardPitchNote[]) {
  const byKey = new Map(labeled.map((note) => [noteKey(note), note]));
  return all.map((note) => byKey.get(noteKey(note)) ?? note);
}
