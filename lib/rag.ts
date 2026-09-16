/** SQL retrieval for drafts: teacher replies + matching score bars. Not pgvector. */
import { Prisma } from "@prisma/client";
import { getReadyPieceModel } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import {
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

export function observationOutline(observations: CompareObservations | null) {
  if (!observations) {
    return [
      "Không có đối chiếu bản nhạc cho take này.",
      "Cấm nhận xét nốt, hợp âm, ngón, hoặc tư thế.",
      "Chỉ được nói nhịp/khoảng lặng/độ dài nếu số đo thật sự kém.",
      "Cấm câu một dòng kiểu 'hay quá' / 'I like your guitar sound'.",
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
    .filter((issue) => issue.confidence >= 0.6)
    .slice(0, 4)
    .map((issue) => {
      const where = formatIssueWhere(issue) ?? "một đoạn";
      return `${issue.type} @ ${where}: expected ${issue.expected}; heard ${issue.observed}`;
    });
  return [
    `Facts bắt buộc phải dùng (không bỏ, không bịa thêm):`,
    `Khen: ${observations.positives.slice(0, 2).join("; ") || "(không có khen cụ thể — khen nhịp hoặc tiếng sạch nếu số đo ổn)"}`,
    `Sửa: ${issues.join(" | ") || "(không có lỗi tin cậy — chỉ khen và một hướng tập từ note bài)"}`,
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
