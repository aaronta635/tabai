/** Stable pitch-path codes stored on analysis metrics; raw text stays in server logs only. */
export const PITCH_ERROR_CODES = {
  not_installed: "not_installed",
  extract_failed: "extract_failed",
  timed_out: "timed_out",
  worker_failed: "worker_failed",
  audio_metrics_failed: "audio_metrics_failed",
} as const;

export type PitchErrorCode = (typeof PITCH_ERROR_CODES)[keyof typeof PITCH_ERROR_CODES];

const PITCH_ERROR_CODE_SET = new Set<string>(Object.values(PITCH_ERROR_CODES));

export function isPitchErrorCode(value: unknown): value is PitchErrorCode {
  return typeof value === "string" && PITCH_ERROR_CODE_SET.has(value);
}

export function classifyPitchPythonError(error: unknown): PitchErrorCode {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("timed out")) return PITCH_ERROR_CODES.timed_out;
    if (msg.includes("not installed") || msg.includes("basic_pitch_notes")) return PITCH_ERROR_CODES.not_installed;
  }
  return PITCH_ERROR_CODES.worker_failed;
}

export function classifyBasicPitchScriptError(raw: unknown): PitchErrorCode {
  if (typeof raw !== "string" || !raw.trim()) return PITCH_ERROR_CODES.extract_failed;
  const lower = raw.toLowerCase();
  if (lower.includes("not installed")) return PITCH_ERROR_CODES.not_installed;
  return PITCH_ERROR_CODES.extract_failed;
}

export function pitchErrorCodeFromMetrics(metrics: unknown): PitchErrorCode | null {
  if (!metrics || typeof metrics !== "object" || Array.isArray(metrics)) return null;
  const code = (metrics as { pitch_error_code?: unknown }).pitch_error_code;
  return isPitchErrorCode(code) ? code : null;
}