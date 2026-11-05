import { loadLocalEnv } from "../lib/load-env";

loadLocalEnv();

async function main() {
  const { prisma } = await import("../lib/prisma");
  const { factTypeScores, formatFactTypeScores, markedBarsFromAnalysis } = await import("../lib/false-bars");
  const { deterministicFacts } = await import("../lib/fact-engine");
  const { pitchNotesFromMetrics } = await import("../lib/pitch-overlay");
  const { parseCompareObservations, verdictCountsForPrecision, verdictIsPrecisionHit } = await import("../lib/score-model");
  type ScoreJson = import("../lib/score-model").ScoreJson;

  const analyses = await prisma.analysis.findMany({
    orderBy: { createdAt: "desc" },
    distinct: ["submissionId"],
    select: {
      observationsJson: true,
      metricsJson: true,
      submission: {
        select: {
          piece: {
            select: {
              title: true,
              models: { where: { status: "ready" }, orderBy: { version: "desc" }, take: 1, select: { scoreJson: true, tutorialCuesJson: true } },
            },
          },
        },
      },
    },
  });

  const stored = analyses.flatMap((row) =>
    markedBarsFromAnalysis({
      pieceTitle: row.submission.piece.title,
      observations: row.observationsJson,
      metrics: row.metricsJson,
    }),
  );
  console.log("Stored facts (Gemini list plus whatever overlay saved)");
  console.log(formatFactTypeScores(stored));

  const rematch: { type: string; verdict: "true" | "false" | null }[] = [];
  for (const row of analyses) {
    const model = row.submission.piece.models[0];
    const score = model?.scoreJson as ScoreJson | undefined;
    if (!score) continue;
    const heard = pitchNotesFromMetrics(row.metricsJson);
    const metrics = row.metricsJson as { tempo_bpm?: unknown } | null;
    const takeBpm = metrics && typeof metrics.tempo_bpm === "number" ? metrics.tempo_bpm : null;
    const cuesJson = model.tutorialCuesJson as { cues?: unknown } | null;
    const cues = Array.isArray(cuesJson?.cues) ? cuesJson.cues : [];
    const fresh = deterministicFacts({
      heard,
      score,
      cues: cues as [],
      takeBpm,
      allowFasterTempo: score.allowFasterTempo === true,
    });
    const storedIssues = parseCompareObservations(row.observationsJson).issues;
    for (const fact of fresh) {
      const near = storedIssues.find((issue) => {
        if (issue.tStart == null || fact.tStart == null) return issue.type === fact.type;
        return Math.abs(issue.tStart - fact.tStart) <= 0.5 && (issue.type === fact.type || sameFamily(issue.type, fact.type));
      });
      if (!near || !verdictCountsForPrecision(near.verdict)) {
        rematch.push({ type: fact.type, verdict: null });
        continue;
      }
      rematch.push({ type: fact.type, verdict: verdictIsPrecisionHit(near.verdict) ? "true" : "false" });
    }
  }

  const labeled = rematch.filter((row) => row.verdict != null);
  console.log("");
  console.log("Rematched deterministic facts overlapped with a teacher mark");
  console.log(
    formatFactTypeScores(
      labeled.map((row) => ({
        pieceTitle: "",
        overlayVersion: "rematch",
        type: row.type,
        verdict: row.verdict,
      })),
    ),
  );
  const byType = factTypeScores(
    labeled.map((row) => ({ pieceTitle: "", overlayVersion: "rematch", type: row.type, verdict: row.verdict })),
  );
  for (const score of byType) {
    if ((score.type === "tempo_vs_target" || score.type === "chord_not_ringing") && score.precision != null) {
      console.log(
        `${score.type} pass line 0.85: ${score.precision >= 0.85 ? "pass" : "below"} (${score.precision.toFixed(2)})`,
      );
    }
  }
  if (!byType.some((score) => score.type === "tempo_vs_target" || score.type === "chord_not_ringing")) {
    console.log("tempo and chord presence: no labeled rematch facts yet, so the 0.85 line is not scored.");
  }
}

function sameFamily(stored: string, fresh: string) {
  if (fresh === "chord_not_ringing") return stored === "chord" || stored === "chord_not_ringing";
  if (fresh === "melody_note_missing" || fresh === "wrong_pitch_semitone") {
    return stored === "pitch" || stored === "missing" || stored === fresh;
  }
  return stored === fresh;
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    const { prisma } = await import("../lib/prisma");
    await prisma.$disconnect();
  });
