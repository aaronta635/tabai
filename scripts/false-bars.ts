import { loadLocalEnv } from "../lib/load-env";

loadLocalEnv();

async function main() {
  const { prisma } = await import("../lib/prisma");
  const { falseBarReport, formatFalseBarReport, markedBarsFromAnalysis } = await import("../lib/false-bars");
  const analyses = await prisma.analysis.findMany({
    orderBy: { createdAt: "desc" },
    distinct: ["submissionId"],
    select: {
      submissionId: true,
      observationsJson: true,
      metricsJson: true,
      submission: { select: { piece: { select: { title: true } } } },
    },
  });
  const extracted = analyses.map((row) =>
    markedBarsFromAnalysis({
      pieceTitle: row.submission.piece.title,
      observations: row.observationsJson,
      metrics: row.metricsJson,
    }),
  );
  const rows = extracted.flat();
  const takes = extracted.filter((bars) => bars.length > 0).length;
  console.log(formatFalseBarReport(falseBarReport(rows), takes));
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
