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

export type DraftLocale = "vi" | "en";

/** Loudness numbers must never become teaching claims unless compare already listed the same issue. */
export function metricGuidance(
  metrics: DraftMetrics | null,
  observations: CompareObservations | null,
  locale: DraftLocale = "vi",
) {
  if (locale === "en") {
    if (!observations) {
      return "No comparison. Do not use silence_ratio, tempo_stability, or tone to invent a mistake. Do not write a draft if this was called by mistake.";
    }
    if (closeMatch(observations)) {
      return "The take matches the piece. Do not use tempo_stability or the numbers to invent a timing mistake.";
    }
    if (!metrics || metrics.skipped) return "No trustworthy audio measures. Do not guess at technique.";
    return "The measures are only a hint. Mention rhythm or silence only when the compare facts already name the same place (with tStart). Do not add more.";
  }
  if (!observations) {
    return "Không có đối chiếu. Cấm dùng silence_ratio, tempo_stability, hay tiếng đàn để bịa lỗi. Không viết draft nếu worker gọi nhầm.";
  }
  if (closeMatch(observations)) {
    return "Take khớp bài. Cấm dùng tempo_stability hay số đo để bịa lỗi nhịp.";
  }
  if (!metrics || metrics.skipped) return "Không có số đo âm thanh đáng tin. Đừng đoán kỹ thuật.";
  return "Số đo chỉ là gợi ý. Chỉ nhắc nhịp/khoảng lặng nếu facts compare đã ghi cùng một chỗ (có tStart). Đừng bịa thêm.";
}

function observationOutlineEn(observations: CompareObservations | null) {
  if (!observations) {
    return [
      "There is no comparison with the piece yet (no PieceModel / compare).",
      "Do not comment on notes, chords, fingers, posture, silence, uneven rhythm, or the feeling of the sound.",
      "Do not invent a mistake from silence_ratio or tempo_stability.",
      "Do not write a long letter. Do not praise tone or feeling.",
    ].join(" ");
  }
  const teacherKept = observations.issues.some((issue) => issue.verdict === "true" || issue.verdict === "false");
  if (observations.pitchJudge === "weak" && !teacherKept) {
    return [
      "The notes on this take could not be read.",
      "Do not say it matches the piece. Do not invent a wrong note or a wrong chord.",
      "You may praise one point about time or sound if another fact already says so. Otherwise say it was hard to hear.",
    ].join(" ");
  }
  if (observations.confidence < 0.45 && !teacherKept) {
    return [
      `The comparison confidence is low (${observations.confidence}).`,
      "Do not name a wrong note. Praise one specific point about time or sound, then mention the lesson note.",
      "Write 50–110 words. Not one sentence.",
    ].join(" ");
  }
  const issues = observations.issues
    .filter((issue) => (teacherKept ? issue.verdict === "true" : issue.confidence >= 0.75))
    .slice(0, teacherKept ? 8 : 4)
    .map((issue) => {
      const where = formatIssueWhere(issue) ?? "one passage";
      return `${issue.type} @ ${where}: expected ${issue.expected}; heard ${issue.observed}`;
    });
  const unjudged = observations.pitchJudge === "weak" ? "Notes and chords could not be read. Do not praise a note match." : "";
  if (closeMatch(observations) || issues.length === 0) {
    return [
      "Required facts (use these, do not drop them, do not invent more):",
      `Praise: ${observations.positives.slice(0, 3).join("; ") || "(praise one specific point about time or a clean sound)"}`,
      "Fix: no trustworthy mistake — do not invent one.",
      unjudged,
      "Next time: keep the feel of this take. Mention the lesson note only if there is one. Do not invent a new mistake.",
    ]
      .filter(Boolean)
      .join("\n");
  }
  return [
    "Required facts (use these, do not drop them, do not invent more):",
    unjudged,
    `Praise: ${observations.positives.slice(0, 2).join("; ") || "(no specific praise — praise time or a clean sound if the measures are steady)"}`,
    `Fix: ${issues.join(" | ")}`,
    `Next time: ${observations.nextPractice || "play slowly, in time"}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function observationOutline(observations: CompareObservations | null, locale: DraftLocale = "vi") {
  if (locale === "en") return observationOutlineEn(observations);
  if (!observations) {
    return [
      "Không có đối chiếu bài (chưa có PieceModel / compare).",
      "Cấm nhận xét nốt, hợp âm, ngón, tư thế, khoảng lặng, nhịp không đều, hay cảm xúc tiếng đàn.",
      "Cấm bịa lỗi từ silence_ratio hoặc tempo_stability.",
      "Không viết thư dài. Không khen 'có hồn' / 'tròn trịa'.",
    ].join(" ");
  }
  const teacherKept = observations.issues.some((issue) => issue.verdict === "true" || issue.verdict === "false");
  if (observations.pitchJudge === "weak" && !teacherKept) {
    return [
      "Không phân tích được nốt trên take này.",
      "Đừng khen là khớp bài. Đừng bịa nốt sai hoặc hợp âm sai.",
      "Có thể khen một điểm về nhịp hoặc tiếng nếu facts khác đã ghi, không thì chỉ nói chưa nghe rõ.",
    ].join(" ");
  }
  if (observations.confidence < 0.45 && !teacherKept) {
    return [
      `Độ tin đối chiếu thấp (${observations.confidence}).`,
      "Không nêu nốt sai. Khen một điểm cụ thể về nhịp hoặc tiếng, rồi nhắc note của bài.",
      "Viết đủ 50–110 chữ. Không một câu.",
    ].join(" ");
  }
  const issues = observations.issues
    .filter((issue) => (teacherKept ? issue.verdict === "true" : issue.confidence >= 0.75))
    .slice(0, teacherKept ? 8 : 4)
    .map((issue) => {
      const where = formatIssueWhere(issue) ?? "một đoạn";
      return `${issue.type} @ ${where}: expected ${issue.expected}; heard ${issue.observed}`;
    });
  const unjudged =
    observations.pitchJudge === "weak" ? "Nốt và hợp âm không phân tích được. Đừng khen là khớp nốt." : "";
  if (closeMatch(observations) || issues.length === 0) {
    return [
      `Facts bắt buộc phải dùng (không bỏ, không bịa thêm):`,
      `Khen: ${observations.positives.slice(0, 3).join("; ") || "(khen một điểm cụ thể về nhịp hoặc tiếng sạch)"}`,
      `Sửa: không có lỗi tin cậy — không bịa điểm sửa.`,
      unjudged,
      `Lần sau: giữ đúng cảm giác take này. Chỉ nhắc note của bài nếu có, không bịa lỗi mới.`,
    ]
      .filter(Boolean)
      .join("\n");
  }
  return [
    `Facts bắt buộc phải dùng (không bỏ, không bịa thêm):`,
    unjudged,
    `Khen: ${observations.positives.slice(0, 2).join("; ") || "(không có khen cụ thể — khen nhịp hoặc tiếng sạch nếu số đo ổn)"}`,
    `Sửa: ${issues.join(" | ")}`,
    `Lần sau: ${observations.nextPractice || "chơi chậm, đúng nhịp"}`,
  ]
    .filter(Boolean)
    .join("\n");
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
