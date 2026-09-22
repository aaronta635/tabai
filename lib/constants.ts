export const CONSENT_VERSION = "2026-09-v1";
export const PIPELINE_VERSION = "audio-metrics-v1";
export const PIPELINE_VERSION_SCORE = "score-compare-v1";
export const PROMPT_VERSION = "draft_reply_vi-v5";
export const TRAIN_PROMPT_VERSION = "train_piece-v3";
export const COMPARE_PROMPT_VERSION = "compare_take-v4";
export const DEFAULT_GEMINI_MODEL_TRAIN = "gemini-3.1-pro-preview";
export const DEFAULT_GEMINI_MODEL_COMPARE = "gemini-3.5-flash";
export const MAX_VIDEO_BYTES = 60 * 1024 * 1024;
export const MAX_SHEET_BYTES = 20 * 1024 * 1024;
export const MAX_VIDEO_SECONDS = 90;
export const MAX_CLIP_SECONDS = 120;
export const MAX_CLIP_BYTES = 40 * 1024 * 1024;
export const MAX_ACTIVE_VOICE_SAMPLES = 40;
export const TEACHER_COOKIE = "teacher_session";
export const STUDENT_COOKIE = "student_token";
export const STUDENT_SESSION_COOKIE = "student_session";
export const ADMIN_COOKIE = "admin_session";
export const LOCALE_COOKIE = "locale";
export const MEDIA_BUCKET = process.env.SUPABASE_MEDIA_BUCKET ?? "media";

export const CONSENT_LINE_VI =
  "Video được gửi cho thầy/cô này và dùng để cải thiện nhận xét. Có thể yêu cầu xóa.";
export const UNDER18_LINE_VI =
  "Tôi trên 18 tuổi hoặc có sự đồng ý của phụ huynh.";
