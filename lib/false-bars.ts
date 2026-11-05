import {
  parseCompareObservations,
  verdictCountsForPrecision,
  verdictIsPrecisionHit,
  type FactVerdict,
} from "@/lib/score-model";

export type MarkedBar = {
  pieceTitle: string;
  overlayVersion: string;
  type: string;
  verdict: FactVerdict;
};

export type FalseBarGroup = {
  pieceTitle: string;
  overlayVersion: string;
  type: string;
  trueCount: number;
  falseCount: number;
  falseRate: number;
};

/** Sai / (Đúng + Sai). Unmarked bars are not included. */
export function falseBarReport(rows: MarkedBar[]): FalseBarGroup[] {
  const groups = new Map<string, FalseBarGroup>();
  for (const row of rows) {
    const key = `${row.pieceTitle}\t${row.overlayVersion}\t${row.type}`;
    const group = groups.get(key) ?? {
      pieceTitle: row.pieceTitle,
      overlayVersion: row.overlayVersion,
      type: row.type,
      trueCount: 0,
      falseCount: 0,
      falseRate: 0,
    };
    if (row.verdict === "true" || row.verdict === "correct_and_send" || row.verdict === "correct_but_skip") {
      group.trueCount += 1;
    } else if (row.verdict !== "unsure") {
      group.falseCount += 1;
    }
    const total = group.trueCount + group.falseCount;
    group.falseRate = total === 0 ? 0 : group.falseCount / total;
    groups.set(key, group);
  }
  return [...groups.values()].sort((a, b) =>
    a.pieceTitle.localeCompare(b.pieceTitle) || a.type.localeCompare(b.type) || a.overlayVersion.localeCompare(b.overlayVersion),
  );
}

export function markedBarsFromAnalysis(input: {
  pieceTitle: string;
  observations: unknown;
  metrics: unknown;
}): MarkedBar[] {
  const overlayVersion = overlayVersionFromMetrics(input.metrics);
  return parseCompareObservations(input.observations)
    .issues.filter((issue) => verdictCountsForPrecision(issue.verdict))
    .map((issue) => ({
      pieceTitle: input.pieceTitle,
      overlayVersion,
      type: issue.type,
      verdict: issue.verdict ?? null,
    }));
}

export type FactTypeScore = {
  type: string;
  precision: number | null;
  recall: number | null;
  wilsonLower: number | null;
  judged: number;
  hits: number;
  keepOutOfDrafts: boolean;
};

/** Wilson score interval, 95% lower bound. */
export function wilsonLowerBound(hits: number, judged: number, z = 1.96) {
  if (judged <= 0) return 0;
  const p = hits / judged;
  const z2 = z * z;
  const denom = 1 + z2 / judged;
  const centre = p + z2 / (2 * judged);
  const margin = z * Math.sqrt((p * (1 - p) + z2 / (4 * judged)) / judged);
  return Math.max(0, (centre - margin) / denom);
}

/**
 * Precision uses teacher marks. Recall of missed notes is not in those marks, so it stays null.
 * A type under 0.70 precision is listed as keep out of drafts. This does not unlock auto-send.
 */
export function factTypeScores(rows: MarkedBar[]): FactTypeScore[] {
  const groups = new Map<string, { hits: number; judged: number }>();
  for (const row of rows) {
    if (!verdictCountsForPrecision(row.verdict)) continue;
    const group = groups.get(row.type) ?? { hits: 0, judged: 0 };
    group.judged += 1;
    if (verdictIsPrecisionHit(row.verdict)) group.hits += 1;
    groups.set(row.type, group);
  }
  return [...groups.entries()]
    .map(([type, group]) => {
      const precision = group.judged === 0 ? null : group.hits / group.judged;
      return {
        type,
        precision,
        recall: null,
        wilsonLower: group.judged === 0 ? null : wilsonLowerBound(group.hits, group.judged),
        judged: group.judged,
        hits: group.hits,
        keepOutOfDrafts: precision != null && precision < 0.7,
      };
    })
    .sort((a, b) => a.type.localeCompare(b.type));
}

export function overlayVersionFromMetrics(metrics: unknown) {
  if (!metrics || typeof metrics !== "object" || Array.isArray(metrics)) return "unknown";
  const version = (metrics as { pitch_overlay_version?: unknown }).pitch_overlay_version;
  return typeof version === "string" && version.trim() ? version : "unknown";
}

export function formatFalseBarReport(groups: FalseBarGroup[], takeCount: number) {
  if (groups.length === 0) return `No marked bars yet. Takes scanned: ${takeCount}.`;
  const lines = [`Marked takes: ${takeCount}`, "piece\ttype\toverlay\ttrue\tfalse\tfalse rate"];
  for (const group of groups) {
    lines.push(
      [
        group.pieceTitle,
        group.type,
        group.overlayVersion,
        String(group.trueCount),
        String(group.falseCount),
        group.falseRate.toFixed(2),
      ].join("\t"),
    );
  }
  return lines.join("\n");
}

export function formatFactTypeScores(rows: MarkedBar[]) {
  const lines = ["type\tprecision\trecall\twilson95\tjudged\tnote"];
  for (const score of factTypeScores(rows)) {
    lines.push(
      [
        score.type,
        score.precision == null ? "n/a" : score.precision.toFixed(2),
        "n/a",
        score.wilsonLower == null ? "n/a" : score.wilsonLower.toFixed(2),
        String(score.judged),
        score.keepOutOfDrafts ? "keep out of drafts" : "",
      ].join("\t"),
    );
  }
  if (lines.length === 1) lines.push("none\tn/a\tn/a\tn/a\t0\t");
  return lines.join("\n");
}
