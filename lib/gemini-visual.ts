import type { SubmissionKind } from "@prisma/client";
import { usesGeminiVisual } from "@/lib/practice";
import { heardExtractFromMetrics } from "@/lib/score-model";

export const GEMINI_VISUAL_ERROR_CODES = {
  upload_failed: "upload_failed",
  not_configured: "not_configured",
  timed_out: "timed_out",
  unavailable: "unavailable",
} as const;

export type GeminiVisualErrorCode = (typeof GEMINI_VISUAL_ERROR_CODES)[keyof typeof GEMINI_VISUAL_ERROR_CODES];

function metricsRow(metrics: unknown): Record<string, unknown> | null {
  if (!metrics || typeof metrics !== "object" || Array.isArray(metrics)) return null;
  return metrics as Record<string, unknown>;
}

export function classifyGeminiVisualError(error: unknown): GeminiVisualErrorCode {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("timed out")) return GEMINI_VISUAL_ERROR_CODES.timed_out;
    if (msg.includes("404") || msg.includes("not found")) return GEMINI_VISUAL_ERROR_CODES.upload_failed;
    if (msg.includes("not configured")) return GEMINI_VISUAL_ERROR_CODES.not_configured;
  }
  return GEMINI_VISUAL_ERROR_CODES.unavailable;
}

export function logGeminiVisualFailure(submissionId: string, error: unknown) {
  console.error("gemini visual pass failed", submissionId, error instanceof Error ? error.message : error);
}

/** Extract is enough when the piece model is not ready; compare needs observations when a model exists. */
export function geminiVisualComplete(metrics: unknown, observations: unknown, pieceHasReadyModel: boolean) {
  if (!heardExtractFromMetrics(metrics)) return false;
  if (!pieceHasReadyModel) return true;
  return observations != null;
}

export function savedAnalysisLacksGeminiVisual(
  kind: SubmissionKind,
  metrics: unknown,
  observations: unknown,
  pieceHasReadyModel: boolean,
) {
  if (!usesGeminiVisual(kind)) return false;
  return !geminiVisualComplete(metrics, observations, pieceHasReadyModel);
}

export function geminiVisualErrorCodeFromMetrics(metrics: unknown): GeminiVisualErrorCode | null {
  const code = metricsRow(metrics)?.gemini_visual_error_code;
  if (typeof code !== "string") return null;
  if (!(code in GEMINI_VISUAL_ERROR_CODES)) return null;
  return code as GeminiVisualErrorCode;
}

export function pitchOverlaySkippedInMetrics(metrics: unknown) {
  return metricsRow(metrics)?.pitch_overlay_skipped === true;
}