import { parseCompareObservations } from "@/lib/score-model";

export type MarkedBar = {
  pieceTitle: string;
  overlayVersion: string;
  type: string;
  verdict: "true" | "false";
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
    if (row.verdict === "true") group.trueCount += 1;
    else group.falseCount += 1;
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
    .issues.filter((issue) => issue.verdict === "true" || issue.verdict === "false")
    .map((issue) => ({
      pieceTitle: input.pieceTitle,
      overlayVersion,
      type: issue.type,
      verdict: issue.verdict as "true" | "false",
    }));
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
