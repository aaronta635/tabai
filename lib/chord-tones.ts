/** Pitch-class helpers for guitar chord symbols (Am, A7, Fm, Cmaj7). */

const LETTER: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export type ParsedChord = {
  symbol: string;
  root: number;
  pcs: number[];
};

export function pitchClass(midi: number) {
  return ((Math.round(midi) % 12) + 12) % 12;
}

export function parseChordSymbol(raw: string): ParsedChord | null {
  const match = raw
    .trim()
    .match(/\b([A-G])([#b]?)(maj7|min7|m7|maj|min|m|dim|aug|sus2|sus4|7|6)?\b/i);
  if (!match) return null;
  const letter = match[1].toUpperCase();
  const root = (LETTER[letter] + (match[2] === "#" ? 1 : match[2] === "b" ? -1 : 0) + 12) % 12;
  const qual = (match[3] ?? "").toLowerCase();
  const pcs = new Set<number>([root]);
  const add = (interval: number) => pcs.add((root + interval) % 12);

  if (qual === "m" || qual === "min") {
    add(3);
    add(7);
  } else if (qual === "dim") {
    add(3);
    add(6);
  } else if (qual === "aug") {
    add(4);
    add(8);
  } else if (qual === "sus2") {
    add(2);
    add(7);
  } else if (qual === "sus4") {
    add(5);
    add(7);
  } else if (qual === "m7" || qual === "min7") {
    add(3);
    add(7);
    add(10);
  } else if (qual === "7") {
    add(4);
    add(7);
    add(10);
  } else if (qual === "maj7") {
    add(4);
    add(7);
    add(11);
  } else if (qual === "6") {
    add(4);
    add(7);
    add(9);
  } else {
    add(4);
    add(7);
  }

  const symbol = `${letter}${match[2] ?? ""}${match[3] ?? ""}`;
  return { symbol, root, pcs: [...pcs].sort((a, b) => a - b) };
}

export function firstChordInText(text: string) {
  return chordsInText(text)[0] ?? parseChordSymbol(
    text
      .replace(/^(heard|nghe thấy|nghe)\s+/i, "")
      .replace(/\b([A-G][#b]?)\s+minor\b/gi, "$1m")
      .replace(/\b([A-G][#b]?)\s+major\b/gi, "$1"),
  );
}

export function chordsInText(text: string) {
  const normalized = text
    .replace(/^(heard|nghe thấy|nghe)\s+/i, "")
    .replace(/\b([A-G][#b]?)\s+minor\b/gi, "$1m")
    .replace(/\b([A-G][#b]?)\s+major\b/gi, "$1");
  const re = /\b([A-G])([#b]?)(maj7|min7|m7|maj|min|m|dim|aug|sus2|sus4|7|6)?\b/gi;
  const found: ParsedChord[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(normalized))) {
    const parsed = parseChordSymbol(match[0]);
    if (parsed) found.push(parsed);
  }
  return found;
}

const GENERIC_CUE_TOPIC = /^(chord change|thay hợp âm)$/i;

/** Desk labels: keep tutorial titles, promote a chord symbol when Gemini wrote "Heard" / "Chord Change". */
export function displayCueTopic(topic: string, instruction: string) {
  const cleaned = topic.replace(/^(heard|nghe thấy|nghe)\s+/i, "").trim();
  if (!cleaned || GENERIC_CUE_TOPIC.test(cleaned)) {
    return firstChordInText(instruction)?.symbol ?? cleaned;
  }
  return cleaned;
}

export function displayCueInstruction(instruction: string) {
  return instruction.replace(/^(heard|nghe thấy|nghe)\s+/i, "").trim();
}

export function pcName(pc: number) {
  return ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][((pc % 12) + 12) % 12];
}

export function pcFromName(name: string) {
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const index = names.indexOf(name);
  return index >= 0 ? index : null;
}

const PRESENT_WEIGHT = 0.08;

/** Same-root shapes a tutor might mix up: Am, A, A7, Am7, Asus2, Asus4. */
export function chordFamily(expected: ParsedChord): ParsedChord[] {
  const rootName = pcName(expected.root);
  const quals = ["", "m", "7", "m7", "sus2", "sus4"];
  return quals
    .map((qual) => parseChordSymbol(`${rootName}${qual}`))
    .filter((row): row is ParsedChord => row != null);
}

/**
 * Name the heard chord inside the tutorial chord's family.
 * A7 needs the major third and the flat seventh. A lone third stays unnamed.
 */
export function matchHeardChord(expected: ParsedChord, heardWeights: Map<number, number>): ParsedChord | null {
  const present = new Set<number>();
  for (const [pc, weight] of heardWeights) {
    if (weight > PRESENT_WEIGHT) present.add(((pc % 12) + 12) % 12);
  }
  if (present.size < 2) return null;

  let best: ParsedChord | null = null;
  let bestScore = -Infinity;
  for (const candidate of chordFamily(expected)) {
    const hit = candidate.pcs.filter((pc) => present.has(pc)).length;
    if (hit < 2) continue;
    const miss = candidate.pcs.length - hit;
    const extra = [...present].filter((pc) => !candidate.pcs.includes(pc)).length;
    const score = hit * 2 - miss - extra;
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  if (!best || best.symbol === expected.symbol) return null;
  return best;
}

const COMMON_QUALS = ["", "m", "7", "m7", "sus2", "sus4"];

export function chordScore(chord: ParsedChord, present: Set<number>) {
  const hit = chord.pcs.filter((pc) => present.has(pc)).length;
  if (hit < 2) return Number.NEGATIVE_INFINITY;
  const miss = chord.pcs.length - hit;
  const extra = [...present].filter((pc) => !chord.pcs.includes(pc)).length;
  return hit * 2 - miss - extra;
}

export function presentFromWeights(heardWeights: Map<number, number>, min = PRESENT_WEIGHT) {
  const present = new Set<number>();
  for (const [pc, weight] of heardWeights) {
    if (weight > min) present.add(((pc % 12) + 12) % 12);
  }
  return present;
}

/** Best everyday guitar chord for this pitch-class set, any root. */
export function bestChord(heardWeights: Map<number, number>): ParsedChord | null {
  const present = presentFromWeights(heardWeights);
  if (present.size < 2) return null;
  let best: ParsedChord | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;
  for (let root = 0; root < 12; root++) {
    for (const qual of COMMON_QUALS) {
      const candidate = parseChordSymbol(`${pcName(root)}${qual}`);
      if (!candidate) continue;
      const score = chordScore(candidate, present);
      if (score > bestScore || (score === bestScore && best && candidate.pcs.length < best.pcs.length)) {
        best = candidate;
        bestScore = score;
      }
    }
  }
  return best;
}

/**
 * A different root that fits clearly better than the expected chord.
 * Same-root shapes (Am vs A7) stay in matchHeardChord.
 */
export function matchWrongRoot(expected: ParsedChord, heardWeights: Map<number, number>): ParsedChord | null {
  const present = presentFromWeights(heardWeights);
  if (present.size < 2) return null;
  const expectedScore = chordScore(expected, present);
  const heard = bestChord(heardWeights);
  if (!heard || heard.root === expected.root) return null;
  if (chordScore(heard, present) < expectedScore + 2) return null;
  return heard;
}

/** True when heard energy prefers the wrong third (Am vs A / A7, F vs Fm). */
export function wrongThird(expected: ParsedChord, heardWeights: Map<number, number>) {
  const minor = (expected.root + 3) % 12;
  const major = (expected.root + 4) % 12;
  const minorW = heardWeights.get(minor) ?? 0;
  const majorW = heardWeights.get(major) ?? 0;
  const expectedMinor = expected.pcs.includes(minor) && !expected.pcs.includes(major);
  const expectedMajor = expected.pcs.includes(major) && !expected.pcs.includes(minor);
  if (expectedMinor && majorW > minorW + 0.08) return { expected: pcName(minor), observed: pcName(major) };
  if (expectedMajor && minorW > majorW + 0.08) return { expected: pcName(major), observed: pcName(minor) };
  return null;
}
