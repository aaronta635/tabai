export type ScoreNote = {
  bar: number;
  beat: number;
  midi: number;
};

const STEP: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

type NoteBuild = {
  step: string | null;
  alter: number;
  octave: number | null;
  duration: number;
  chord: boolean;
  rest: boolean;
  grace: boolean;
  tieStop: boolean;
};

type Tag = {
  kind: "open" | "close" | "empty";
  name: string;
  attrs: Record<string, string>;
};

export function isMusicXmlPath(path: string) {
  const name = path.split("/").pop()?.split("?")[0]?.toLowerCase() ?? "";
  return name.endsWith(".musicxml") || name.endsWith(".xml");
}

function localName(name: string) {
  const trimmed = name.trim();
  const index = trimmed.indexOf(":");
  return (index === -1 ? trimmed : trimmed.slice(index + 1)).toLowerCase();
}

function parseTag(raw: string): Tag | null {
  if (raw.startsWith("<?") || raw.startsWith("<!")) return null;
  const empty = raw.endsWith("/>");
  const body = raw.slice(1, empty ? -2 : -1).trim();
  if (body.startsWith("/")) {
    return { kind: "close", name: localName(body.slice(1)), attrs: {} };
  }
  const name = localName(body.match(/^[^\s/]+/)?.[0] ?? "");
  if (!name) return null;
  const attrs: Record<string, string> = {};
  for (const attr of body.matchAll(/([^\s=]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
    attrs[localName(attr[1])] = attr[2] ?? attr[3] ?? "";
  }
  return { kind: empty ? "empty" : "open", name, attrs };
}

function midiOf(note: NoteBuild) {
  if (!note.step || note.octave == null) return null;
  const base = STEP[note.step.toUpperCase()];
  if (base == null || !Number.isFinite(note.octave)) return null;
  const alter = Number.isFinite(note.alter) ? note.alter : 0;
  return base + alter + (note.octave + 1) * 12;
}

/**
 * Pitched notes in performance order. Beat is quarter-lengths from the start of the bar.
 * Chord tones share an onset. Rests, grace notes, and tie stops are not notes.
 */
export function parseMusicXml(xml: string): ScoreNote[] {
  if (!/<score-partwise[\s>]/i.test(xml)) {
    throw new Error("MusicXML must be score-partwise");
  }

  const notes: Array<ScoreNote & { index: number }> = [];
  const stack: string[] = [];
  let divisions = 1;
  let bar = 1;
  let nextBar = 1;
  let cursor = 0;
  let lastOnset = 0;
  let note: NoteBuild | null = null;
  let capture: "step" | "alter" | "octave" | "duration" | "divisions" | null = null;
  let backupDuration = 0;
  let forwardDuration = 0;

  const parent = () => stack[stack.length - 2] ?? "";

  const commit = () => {
    if (!note) return;
    const current = note;
    note = null;
    const quarters = divisions > 0 ? current.duration / divisions : 0;
    if (current.grace) return;
    const onset = current.chord ? lastOnset : cursor;
    const midi = midiOf(current);
    if (!current.rest && !current.tieStop && midi != null) {
      notes.push({ bar, beat: onset, midi, index: notes.length });
    }
    if (!current.chord) {
      lastOnset = cursor;
      cursor += quarters;
    }
  };

  const open = (tag: Tag) => {
    stack.push(tag.name);
    if (tag.name === "part") divisions = 1;
    if (tag.name === "measure") {
      cursor = 0;
      lastOnset = 0;
      const number = Number(tag.attrs.number);
      if (Number.isFinite(number)) {
        bar = number;
        nextBar = number + 1;
      } else {
        bar = nextBar;
        nextBar += 1;
      }
    }
    if (tag.name === "note") {
      note = {
        step: null,
        alter: 0,
        octave: null,
        duration: 0,
        chord: false,
        rest: false,
        grace: false,
        tieStop: false,
      };
    }
    if (tag.name === "backup") backupDuration = 0;
    if (tag.name === "forward") forwardDuration = 0;
    if (note && tag.name === "chord") note.chord = true;
    if (note && tag.name === "rest") note.rest = true;
    if (note && tag.name === "grace") note.grace = true;
    if (note && (tag.name === "tie" || tag.name === "tied") && tag.attrs.type === "stop") note.tieStop = true;
    if (tag.name === "step" || tag.name === "alter" || tag.name === "octave" || tag.name === "duration" || tag.name === "divisions") {
      capture = tag.name;
    }
  };

  const close = (name: string) => {
    if (name === "note") commit();
    if (name === "backup") cursor -= divisions > 0 ? backupDuration / divisions : 0;
    if (name === "forward") cursor += divisions > 0 ? forwardDuration / divisions : 0;
    if (capture === name) capture = null;
    if (stack[stack.length - 1] === name) stack.pop();
  };

  const takeText = (text: string) => {
    const value = text.trim();
    if (!value || !capture) return;
    const amount = Number(value);
    if (capture === "divisions" && amount > 0) divisions = amount;
    if (capture === "duration" && Number.isFinite(amount)) {
      if (parent() === "note" && note) note.duration = amount;
      if (parent() === "backup") backupDuration = amount;
      if (parent() === "forward") forwardDuration = amount;
    }
    if (!note) return;
    if (capture === "step") note.step = value;
    if (capture === "alter" && Number.isFinite(amount)) note.alter = amount;
    if (capture === "octave" && Number.isFinite(amount)) note.octave = amount;
  };

  let index = 0;
  while (index < xml.length) {
    if (xml.startsWith("<!--", index)) {
      const end = xml.indexOf("-->", index);
      index = end === -1 ? xml.length : end + 3;
      continue;
    }
    if (xml[index] !== "<") {
      const next = xml.indexOf("<", index);
      takeText(xml.slice(index, next === -1 ? xml.length : next));
      index = next === -1 ? xml.length : next;
      continue;
    }
    const end = xml.indexOf(">", index);
    if (end === -1) break;
    const tag = parseTag(xml.slice(index, end + 1));
    index = end + 1;
    if (!tag) continue;
    if (tag.kind === "close") close(tag.name);
    else {
      open(tag);
      if (tag.kind === "empty") close(tag.name);
    }
  }

  notes.sort((a, b) => a.bar - b.bar || a.beat - b.beat || a.index - b.index);
  return notes.map(({ bar: noteBar, beat, midi }) => ({ bar: noteBar, beat, midi }));
}
