import { pitchClass } from "@/lib/chord-tones";

export type SeqNote = { midi: number };

export type PathStep = {
  expectedIndex: number;
  heardIndex: number | null;
};

const INDEL = 1;
const SEMITONE = 0.5;
const MISMATCH = 2;

export function pitchDistance(a: number, b: number) {
  const delta = Math.abs(pitchClass(a) - pitchClass(b));
  return Math.min(delta, 12 - delta);
}

function subCost(expectedMidi: number, heardMidi: number) {
  const delta = pitchDistance(expectedMidi, heardMidi);
  if (delta === 0) return 0;
  if (delta === 1) return SEMITONE;
  return MISMATCH;
}

function warp(i: number, j: number, n: number, m: number) {
  if (n <= 1 || m <= 1) return 0;
  return Math.abs((i - 1) / (n - 1) - (j - 1) / (m - 1)) * 0.75;
}

/** Pitch-class DTW. An extra or skipped note is an insertion or deletion. */
export function alignNotes(expected: SeqNote[], heard: SeqNote[], shift = 0): { cost: number; steps: PathStep[] } {
  const n = expected.length;
  const m = heard.length;
  const dp = Array.from({ length: n + 1 }, () => new Float64Array(m + 1).fill(Number.POSITIVE_INFINITY));
  const how: ("diag" | "up" | "left")[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill("diag"));
  dp[0][0] = 0;
  for (let i = 1; i <= n; i++) {
    dp[i][0] = i * INDEL;
    how[i][0] = "up";
  }
  for (let j = 1; j <= m; j++) {
    dp[0][j] = j * INDEL;
    how[0][j] = "left";
  }
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const diag = dp[i - 1][j - 1] + subCost(expected[i - 1].midi + shift, heard[j - 1].midi) + warp(i, j, n, m);
      const up = dp[i - 1][j] + INDEL;
      const left = dp[i][j - 1] + INDEL;
      if (diag <= up && diag <= left) {
        dp[i][j] = diag;
        how[i][j] = "diag";
      } else if (up <= left) {
        dp[i][j] = up;
        how[i][j] = "up";
      } else {
        dp[i][j] = left;
        how[i][j] = "left";
      }
    }
  }

  const rev: PathStep[] = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    const move = i === 0 ? "left" : j === 0 ? "up" : how[i][j];
    if (move === "diag") {
      rev.push({ expectedIndex: i - 1, heardIndex: j - 1 });
      i -= 1;
      j -= 1;
    } else if (move === "up") {
      rev.push({ expectedIndex: i - 1, heardIndex: null });
      i -= 1;
    } else {
      j -= 1;
    }
  }
  rev.reverse();
  return { cost: dp[n][m], steps: rev };
}

export type ShiftedAlignment = {
  shift: number;
  cost: number;
  steps: PathStep[];
};

/**
 * Try a constant MIDI shift. Use it only when the whole take fits that shift
 * clearly better than the original key.
 */
export function alignWithShift(expected: SeqNote[], heard: SeqNote[]): ShiftedAlignment {
  const base = alignNotes(expected, heard, 0);
  let best: ShiftedAlignment = { shift: 0, cost: base.cost, steps: base.steps };
  for (let shift = -5; shift <= 7; shift++) {
    if (shift === 0) continue;
    const next = alignNotes(expected, heard, shift);
    if (next.cost < best.cost) best = { shift, cost: next.cost, steps: next.steps };
  }
  const gain = base.cost - best.cost;
  const clear = best.shift !== 0 && gain >= Math.max(1.5, expected.length * 0.4) && best.cost <= base.cost * 0.55;
  if (!clear) return { shift: 0, cost: base.cost, steps: base.steps };
  return best;
}
