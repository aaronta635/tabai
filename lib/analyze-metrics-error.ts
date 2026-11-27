export const AUDIO_METRICS_ERROR_CODES = {
  analyze_python_failed: "analyze_python_failed",
} as const;

export type AudioMetricsErrorCode = (typeof AUDIO_METRICS_ERROR_CODES)[keyof typeof AUDIO_METRICS_ERROR_CODES];

export function classifyAnalyzePythonError(error: unknown): AudioMetricsErrorCode {
  return AUDIO_METRICS_ERROR_CODES.analyze_python_failed;
}