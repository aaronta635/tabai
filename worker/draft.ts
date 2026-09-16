import Anthropic from "@anthropic-ai/sdk";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { MAX_ACTIVE_VOICE_SAMPLES, PROMPT_VERSION } from "../lib/constants";
import { geminiClient, geminiCompareModel, geminiCostCents, generateGeminiText } from "../lib/gemini";
import { routeSubmission } from "../lib/growth";
import { prisma } from "../lib/prisma";
import { isCompareObservations, type CompareObservations } from "../lib/score-model";

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

function observationNotes(observations: CompareObservations | null) {
  if (!observations) {
    return "Không có đối chiếu bản nhạc. Không được nhận xét nốt, hợp âm, hoặc kỹ thuật video.";
  }
  if (observations.confidence < 0.45) {
    return `Độ tin thấp (${observations.confidence}). Chỉ khen chung và nhắc note của bài. Không nêu nốt sai.`;
  }
  return `Dùng observationsJson làm nguồn duy nhất cho nốt/hợp âm/kỹ thuật. Confidence ${observations.confidence}.`;
}

async function loadSystemPrompt() {
  const path = join(process.cwd(), "prompts/draft_reply_vi.md");
  return readFile(path, "utf8");
}

function buildUserPrompt(input: {
  title: string;
  note: string | null;
  studentName: string;
  previousText: string | null;
  metrics: Metrics | null;
  observations: CompareObservations | null;
  samples: string[];
}) {
  return [
    `Bài: ${input.title}`,
    input.note ? `Note của thầy: ${input.note}` : "Không có note.",
    `Học viên: ${input.studentName}`,
    input.previousText ? `Nhận xét lần trước (cùng bài): ${input.previousText}` : "Chưa có nhận xét trước.",
    `Số đo: ${JSON.stringify(input.metrics)}`,
    `Cách dùng số đo: ${softMetricNotes(input.metrics)}`,
    `Đối chiếu bản nhạc: ${JSON.stringify(input.observations)}`,
    `Cách dùng đối chiếu: ${observationNotes(input.observations)}`,
    input.samples.length
      ? `Giọng thầy (mẫu):\n${input.samples.map((s) => `- ${s}`).join("\n")}`
      : "Chưa có mẫu giọng. Viết ngắn, ấm, như thầy guitar Việt Nam nói chuyện với học viên.",
  ].join("\n\n");
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
  const observationsRaw = submission.analyses[0]?.observationsJson ?? null;
  const observations = isCompareObservations(observationsRaw) ? observationsRaw : null;
  const started = Date.now();
  const system = await loadSystemPrompt();
  const user = buildUserPrompt({
    title: submission.piece.title,
    note: submission.piece.note,
    studentName: submission.student.name,
    previousText: previous?.text ?? null,
    metrics,
    observations,
    samples,
  });

  let text: string;
  let usedModel = "context-only";
  const gemini = geminiClient();
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (gemini) {
    usedModel = geminiCompareModel();
    const response = await generateGeminiText({
      ai: gemini,
      model: usedModel,
      system,
      userText: user,
    });
    text =
      response.text ||
      fallbackDraft(submission.student.name, submission.piece.title, submission.piece.note);
    usedModel = response.model;
    await prisma.event.create({
      data: {
        actorType: "system",
        name: "draft.cost",
        teacherId: submission.piece.teacherId,
        actorId: submissionId,
        propsJson: {
          ...response.usage,
          costCents: geminiCostCents(response.usage),
          latencyMs: Date.now() - started,
          model: usedModel,
        },
      },
    });
  } else if (anthropicKey) {
    usedModel = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514";
    const anthropic = new Anthropic({ apiKey: anthropicKey });
    const response = await anthropic.messages.create({
      model: usedModel,
      max_tokens: 400,
      system,
      messages: [{ role: "user", content: user }],
    });
    const block = response.content.find((part) => part.type === "text");
    text =
      block && block.type === "text"
        ? block.text.trim()
        : fallbackDraft(submission.student.name, submission.piece.title, submission.piece.note);

    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;
    const costCents = Math.max(1, Math.round((inputTokens * 0.0003 + outputTokens * 0.0015) / 10));
    await prisma.event.create({
      data: {
        actorType: "system",
        name: "draft.cost",
        teacherId: submission.piece.teacherId,
        actorId: submissionId,
        propsJson: { inputTokens, outputTokens, costCents, latencyMs: Date.now() - started, model: usedModel },
      },
    });
  } else {
    text = fallbackDraft(submission.student.name, submission.piece.title, submission.piece.note);
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
