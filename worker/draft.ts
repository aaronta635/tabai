import Anthropic from "@anthropic-ai/sdk";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { MAX_ACTIVE_VOICE_SAMPLES, PROMPT_VERSION } from "../lib/constants";
import {
  geminiClient,
  geminiCostCents,
  geminiDraftModel,
  generateGeminiText,
} from "../lib/gemini";
import { routeSubmission, sendApprovedDraft } from "../lib/growth";
import { prisma } from "../lib/prisma";
import { metricGuidance, observationOutline, retrieveDraftContext, type DraftMetrics, type DraftRetrieval } from "../lib/rag";
import {
  observationsForDraft,
  parseCompareObservations,
  whyDraftNotReady,
  type CompareObservations,
} from "../lib/score-model";

function formatExamples(rows: { source: string; text: string }[]) {
  if (!rows.length) return "Chưa có nhận xét cũ trên bài này.";
  return rows.map((row) => `- (${row.source}) ${row.text}`).join("\n");
}

async function loadSystemPrompt() {
  return readFile(join(process.cwd(), "prompts/draft_reply_vi.md"), "utf8");
}

function buildUserPrompt(input: {
  title: string;
  note: string | null;
  studentName: string;
  metrics: DraftMetrics | null;
  observations: CompareObservations | null;
  samples: string[];
  retrieval: DraftRetrieval;
}) {
  return [
    `Bài: ${input.title}`,
    input.note ? `Note của thầy: ${input.note}` : "Không có note.",
    `Học viên: ${input.studentName}`,
    input.retrieval.previousText
      ? `Nhận xét lần trước (cùng học viên, cùng bài): ${input.retrieval.previousText}`
      : "Chưa có nhận xét trước cho học viên này.",
    `Facts bắt buộc:\n${observationOutline(input.observations)}`,
    `Số đo: ${JSON.stringify(input.metrics)}`,
    `Cách dùng số đo: ${metricGuidance(input.metrics, input.observations)}`,
    input.retrieval.scoreHints.length
      ? `Đoạn score/tutorial liên quan:\n${input.retrieval.scoreHints.map((hint) => `- ${hint}`).join("\n")}`
      : "Không có đoạn score gắn với lỗi.",
    `Nhận xét cũ cùng bài (giọng, không phải facts):\n${formatExamples(input.retrieval.pieceReplies)}`,
    `Nhận xét cũ cùng loại lỗi:\n${formatExamples(input.retrieval.similarReplies)}`,
    input.samples.length
      ? `Giọng thầy (mẫu):\n${input.samples.map((s) => `- ${s}`).join("\n")}`
      : "Chưa có mẫu giọng. Viết 50–110 chữ, ấm, cụ thể, kèm mốc giờ nếu facts có.",
  ].join("\n\n");
}

export async function runDraft(submissionId: string) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      student: true,
      piece: { include: { teacher: { include: { voiceSamples: { where: { active: true } } } } } },
      analyses: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!submission) throw new Error("submission not found");
  if (!submission.student.approvedAt) {
    throw new Error("student not approved — refusing draft");
  }
  if (submission.kind === "practice") return;
  const skip = whyDraftNotReady({
    kind: submission.kind,
    status: submission.status,
    approved: Boolean(submission.student.approvedAt),
    observations: submission.analyses[0]?.observationsJson,
  });
  if (skip) {
    console.log("draft skip", submissionId, skip);
    throw new Error(`draft skip: ${skip}`);
  }
  const parsed = parseCompareObservations(submission.analyses[0]?.observationsJson);
  const observations = observationsForDraft(parsed);
  if (!observations) {
    console.log("draft skip", submissionId, "no_kept_facts");
    throw new Error("draft skip: no_kept_facts");
  }
  console.log(
    "draft begin",
    submissionId,
    submission.piece.title,
    `kept ${observations.issues.length}/${parsed.issues.length}`,
  );
  const samples = submission.piece.teacher.voiceSamples
    .slice(0, MAX_ACTIVE_VOICE_SAMPLES)
    .map((s) => s.text);
  const metrics = (submission.analyses[0]?.metricsJson ?? null) as DraftMetrics | null;
  const retrieval = await retrieveDraftContext({
    teacherId: submission.piece.teacherId,
    pieceId: submission.pieceId,
    studentId: submission.studentId,
    submissionId,
    observations,
  });
  const started = Date.now();
  const system = await loadSystemPrompt();
  const user = buildUserPrompt({
    title: submission.piece.title,
    note: submission.piece.note,
    studentName: submission.student.name,
    metrics,
    observations,
    samples,
    retrieval,
  });

  let text: string;
  let usedModel = "context-only";
  const gemini = geminiClient();
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (gemini) {
    usedModel = geminiDraftModel();
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
          ragPieceReplies: retrieval.pieceReplies.length,
          ragSimilar: retrieval.similarReplies.length,
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
  console.log("draft wrote", submissionId, usedModel, `${text.length} chars`);

  await prisma.submission.update({
    where: { id: submissionId },
    data: {
      ...(submission.status === "new" ? { status: "drafted" as const } : {}),
      route,
    },
  });

  if (route === "ai_direct") {
    await sendApprovedDraft({
      submissionId,
      teacherId: submission.piece.teacherId,
      text,
    });
  }
}

function fallbackDraft(name: string, title: string, note: string | null) {
  const focus = note?.trim() || "đúng nhịp và tiếng sạch";
  return `Thầy đã nghe ${name} chơi ${title}. Đoạn mở đầu ổn, giữ nhịp đó. Lần sau tập trung ${focus}, chơi chậm một nhịp rồi gửi lại một take.`;
}
