/** SQL retrieval for drafts: teacher replies + matching score bars. Not pgvector. */
import { Prisma } from "@prisma/client";
import { getReadyPieceModel } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import {
  closeMatch,
  formatIssueWhere,
  isCompareObservations,
  type CompareObservations,
  type IssueType,
  type ScoreJson,
  type TutorialCuesJson,
} from "@/lib/score-model";

export type RetrievedExample = {
  source: string;
  text: string;
};

export type DraftRetrieval = {
  previousText: string | null;
  pieceReplies: RetrievedExample[];
  similarReplies: RetrievedExample[];
  scoreHints: string[];
};

function issueTypes(observations: CompareObservations | null): IssueType[] {
  if (!observations) return [];
  return [...new Set(observations.issues.map((issue) => issue.type))];
}

function overlappingBars(observations: CompareObservations | null): number[] {
  if (!observations) return [];
  return observations.issues
    .map((issue) => issue.bar)
    .filter((bar): bar is number => typeof bar === "number");
}

export type DraftMetrics = {
  duration_s?: number;
  silence_ratio?: number;
  tempo_stability?: number | null;
  tempo_bpm?: number | null;
  skipped?: boolean;
};

/** Loudness numbers must never become teaching claims unless compare already listed the same issue. */
export function metricGuidance(metrics: DraftMetrics | null, observations: CompareObservations | null) {
  if (!observations) {
    return "Không có đối chiếu. Cấm dùng silence_ratio, tempo_stability, hay tiếng đàn để bịa lỗi. Không viết draft nếu worker gọi nhầm.";
  }
  if (closeMatch(observations)) {
    return "Take khớp bài. Cấm dùng tempo_stability hay số đo để bịa lỗi nhịp.";
  }
  if (!metrics || metrics.skipped) return "Không có số đo âm thanh đáng tin. Đừng đoán kỹ thuật.";
  return "Số đo chỉ là gợi ý. Chỉ nhắc nhịp/khoảng lặng nếu facts compare đã ghi cùng một chỗ (có tStart). Đừng bịa thêm.";
}

export function observationOutline(observations: CompareObservations | null) {
  if (!observations) {
    return [
      "Không có đối chiếu bài (chưa có PieceModel / compare).",
      "Cấm nhận xét nốt, hợp âm, ngón, tư thế, khoảng lặng, nhịp không đều, hay cảm xúc tiếng đàn.",
      "Cấm bịa lỗi từ silence_ratio hoặc tempo_stability.",
      "Không viết thư dài. Không khen 'có hồn' / 'tròn trịa'.",
    ].join(" ");
  }
  if (observations.confidence < 0.45) {
    return [
      `Độ tin đối chiếu thấp (${observations.confidence}).`,
      "Không nêu nốt sai. Khen một điểm cụ thể về nhịp hoặc tiếng, rồi nhắc note của bài.",
      "Viết đủ 50–110 chữ. Không một câu.",
    ].join(" ");
  }
  const issues = observations.issues
    .filter((issue) => issue.confidence >= 0.75)
    .slice(0, 4)
    .map((issue) => {
      const where = formatIssueWhere(issue) ?? "một đoạn";
      return `${issue.type} @ ${where}: expected ${issue.expected}; heard ${issue.observed}`;
    });
  if (closeMatch(observations) || issues.length === 0) {
    return [
      `Facts bắt buộc phải dùng (không bỏ, không bịa thêm):`,
      `Khen: ${observations.positives.slice(0, 3).join("; ") || "(khen một điểm cụ thể về nhịp hoặc tiếng sạch)"}`,
      `Sửa: không có lỗi tin cậy — không bịa điểm sửa.`,
      `Lần sau: giữ đúng cảm giác take này. Chỉ nhắc note của bài nếu có, không bịa lỗi mới.`,
    ].join("\n");
  }
  return [
    `Facts bắt buộc phải dùng (không bỏ, không bịa thêm):`,
    `Khen: ${observations.positives.slice(0, 2).join("; ") || "(không có khen cụ thể — khen nhịp hoặc tiếng sạch nếu số đo ổn)"}`,
    `Sửa: ${issues.join(" | ")}`,
    `Lần sau: ${observations.nextPractice || "chơi chậm, đúng nhịp"}`,
  ].join("\n");
}

export async function retrieveDraftContext(input: {
  teacherId: string;
  pieceId: string;
  studentId: string;
  submissionId: string;
  observations: CompareObservations | null;
}): Promise<DraftRetrieval> {
  const types = issueTypes(input.observations);
  const bars = overlappingBars(input.observations);

  const [previous, pieceReplies, similarRows, pieceModel] = await Promise.all([
    prisma.reply.findFirst({
      where: {
        submission: { studentId: input.studentId, pieceId: input.pieceId },
        submissionId: { not: input.submissionId },
      },
      orderBy: { sentAt: "desc" },
    }),
    prisma.reply.findMany({
      where: {
        teacherId: input.teacherId,
        submission: { pieceId: input.pieceId, id: { not: input.submissionId } },
      },
      orderBy: [{ teacherPick: "desc" }, { sentAt: "desc" }],
      take: 12,
    }),
    types.length
      ? prisma.analysis.findMany({
          where: {
            submission: {
              pieceId: input.pieceId,
              status: "answered",
              id: { not: input.submissionId },
            },
            NOT: { observationsJson: { equals: Prisma.DbNull } },
          },
          include: {
            submission: {
              include: { replies: { orderBy: { sentAt: "desc" }, take: 1 } },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 40,
        })
      : Promise.resolve([]),
    getReadyPieceModel(input.pieceId),
  ]);

  const preferred = pieceReplies.filter((row) => row.teacherPick || row.source === "edited_draft");
  const ranked = [...preferred, ...pieceReplies.filter((row) => !preferred.includes(row))];
  const uniquePiece: RetrievedExample[] = [];
  const seen = new Set<string>();
  for (const row of ranked) {
    const text = row.text.trim();
    if (text.length < 20 || seen.has(text)) continue;
    seen.add(text);
    uniquePiece.push({
      source: row.teacherPick ? "thầy chọn" : row.source,
      text,
    });
    if (uniquePiece.length >= 5) break;
  }

  const similarReplies: RetrievedExample[] = [];
  for (const row of similarRows) {
    const obs = isCompareObservations(row.observationsJson) ? row.observationsJson : null;
    if (!obs) continue;
    const overlap = obs.issues.some((issue) => types.includes(issue.type));
    if (!overlap) continue;
    const reply = row.submission.replies[0];
    if (!reply) continue;
    const text = reply.text.trim();
    if (text.length < 20 || seen.has(text)) continue;
    seen.add(text);
    similarReplies.push({ source: `cùng lỗi ${types.join(",")}`, text });
    if (similarReplies.length >= 3) break;
  }

  const scoreHints: string[] = [];
  const score = pieceModel?.scoreJson as ScoreJson | null;
  if (score?.sections && bars.length) {
    for (const section of score.sections) {
      const hit = bars.some((bar) => bar >= section.startBar && bar <= section.endBar);
      if (!hit) continue;
      const chords = section.chords.length ? `chords ${section.chords.join(" ")}` : "";
      const notes = section.melodyNotes.length ? `melody ${section.melodyNotes.slice(0, 8).join(" ")}` : "";
      scoreHints.push(`${section.name} bars ${section.startBar}–${section.endBar} ${chords} ${notes}`.trim());
    }
  }
  const cues = (pieceModel?.tutorialCuesJson as TutorialCuesJson | null)?.cues ?? [];
  for (const cue of cues.slice(0, 4)) {
    scoreHints.push(`tutorial ${cue.tStart}s ${cue.topic}: ${cue.instruction}`);
  }

  return {
    previousText: previous?.text ?? null,
    pieceReplies: uniquePiece,
    similarReplies,
    scoreHints,
  };
}
