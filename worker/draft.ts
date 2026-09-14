import Anthropic from "@anthropic-ai/sdk";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { MAX_ACTIVE_VOICE_SAMPLES, PROMPT_VERSION } from "../lib/constants";
import { routeSubmission } from "../lib/growth";
import { prisma } from "../lib/prisma";

type Metrics = {
  duration_s?: number;
  silence_ratio?: number;
  tempo_stability?: number | null;
  tempo_bpm?: number | null;
  skipped?: boolean;
};

function softMetricNotes(metrics: Metrics | null) {
  if (!metrics || metrics.skipped) return "Không có số đo âm thanh đáng tin. Đừng đoán kỹ thuật.";
  const notes: string[] = [];
  if (typeof metrics.tempo_stability === "number" && metrics.tempo_stability > 0.12) {
    notes.push("Nhịp có vẻ không đều (tempo_stability cao). Chỉ nói nếu thật sự rõ.");
  }
  if (typeof metrics.silence_ratio === "number" && metrics.silence_ratio > 0.45) {
    notes.push("Nhiều khoảng lặng.");
  }
  if (typeof metrics.duration_s === "number" && metrics.duration_s < 15) {
    notes.push("Bài quay khá ngắn.");
  }
  if (notes.length === 0) {
    return "Số đo không chỉ ra vấn đề rõ. Đừng bịa lỗi. Khen một điểm cụ thể và nhắc đúng note của bài.";
  }
  return notes.join(" ");
}

async function loadSystemPrompt() {
  const path = join(process.cwd(), "prompts/draft_reply_vi.md");
  return readFile(path, "utf8");
}

export async function runDraft(submissionId: string) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      student: true,
      piece: { include: { teacher: { include: { voiceSamples: { where: { active: true } } } } } },
      analyses: { orderBy: { createdAt: "desc" }, take: 1 },
      replies: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!submission) throw new Error("submission not found");
  if (!submission.student.approvedAt) {
    throw new Error("student not approved — refusing draft");
  }

  const samples = submission.piece.teacher.voiceSamples
    .slice(0, MAX_ACTIVE_VOICE_SAMPLES)
    .map((s) => s.text);
  const previous = await prisma.reply.findFirst({
    where: {
      submission: { studentId: submission.studentId, pieceId: submission.pieceId },
    },
    orderBy: { sentAt: "desc" },
  });

  const metrics = (submission.analyses[0]?.metricsJson ?? null) as Metrics | null;
  const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514";
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const started = Date.now();

  let text: string;
  let usedModel = model;

  if (!apiKey) {
    usedModel = "context-only";
    text = fallbackDraft(submission.student.name, submission.piece.title, submission.piece.note);
  } else {
    const anthropic = new Anthropic({ apiKey });
    const system = await loadSystemPrompt();
    const user = [
      `Bài: ${submission.piece.title}`,
      submission.piece.note ? `Note của thầy: ${submission.piece.note}` : "Không có note.",
      `Học viên: ${submission.student.name}`,
      previous ? `Nhận xét lần trước (cùng bài): ${previous.text}` : "Chưa có nhận xét trước.",
      `Số đo: ${JSON.stringify(metrics)}`,
      `Cách dùng số đo: ${softMetricNotes(metrics)}`,
      samples.length
        ? `Giọng thầy (mẫu):\n${samples.map((s) => `- ${s}`).join("\n")}`
        : "Chưa có mẫu giọng. Viết ngắn, ấm, như thầy guitar Việt Nam nói chuyện với học viên.",
    ].join("\n\n");

    const response = await anthropic.messages.create({
      model,
      max_tokens: 400,
      system,
      messages: [{ role: "user", content: user }],
    });
    const block = response.content.find((part) => part.type === "text");
    text = block && block.type === "text" ? block.text.trim() : fallbackDraft(
      submission.student.name,
      submission.piece.title,
      submission.piece.note,
    );

    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;
    const costCents = Math.max(1, Math.round((inputTokens * 0.0003 + outputTokens * 0.0015) / 10));
    await prisma.event.create({
      data: {
        actorType: "system",
        name: "draft.cost",
        teacherId: submission.piece.teacherId,
        actorId: submissionId,
        propsJson: { inputTokens, outputTokens, costCents, latencyMs: Date.now() - started, model },
      },
    });
  }

  const route = routeSubmission({
    aiDirectUnlockedAt: submission.piece.aiDirectUnlockedAt,
    confidence: submission.confidence,
  });

  await prisma.draft.create({
    data: {
      submissionId,
      promptVersion: PROMPT_VERSION,
      model: usedModel,
      text,
    },
  });

  await prisma.submission.update({
    where: { id: submissionId },
    data: {
      ...(submission.status === "new" ? { status: "drafted" as const } : {}),
      route,
    },
  });
}

function fallbackDraft(name: string, title: string, note: string | null) {
  const focus = note?.trim() || "đúng nhịp và tiếng sạch";
  return `Thầy đã nghe ${name} chơi ${title}. Giữ vững những gì đang ổn, lần sau tập trung ${focus}. Quay lại một take nữa rồi gửi thầy.`;
}
