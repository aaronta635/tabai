export const CONSENT_VERSION = "2026-09-v1";
export const PIPELINE_VERSION = "audio-metrics-v1";
export const PIPELINE_VERSION_SCORE = "score-compare-v1";
export const PROMPT_VERSION = "draft_reply_vi-v11";
export const PROMPT_VERSION_EN = "draft_reply_en-v4";
export const TRAIN_PROMPT_VERSION = "train_piece-v4";
export const COMPARE_PROMPT_VERSION = "compare_take-v6";
export const EXTRACT_TAKE_PROMPT_VERSION = "extract_take-v2";
export const PITCH_OVERLAY_VERSION = "pitch-overlay-v8";
/** Prisma connect_timeout is 8s and pool_timeout is 10s (`lib/prisma-pool.ts`). Thin Next JSON routes abort just after that. */
export const API_WAIT_MS = 15_000;
/** storage-js has no HTTP timeout; signed URL / remove are metadata JSON. */
export const STORAGE_META_WAIT_MS = 10_000;
/** Worker download of a take (MAX_VIDEO_BYTES) from Cloud Run to Supabase. */
export const STORAGE_DOWNLOAD_WAIT_MS = 60_000;
/** Worker upload of a derived wav. */
export const STORAGE_UPLOAD_WAIT_MS = 15_000;
/** Browser PUT of a take/tutorial (up to 60MB). A slow phone needs more than a minute. */
export const MEDIA_PUT_WAIT_MS = 120_000;
/** Browser PUT of a sheet (MAX_SHEET_BYTES). */
export const SHEET_PUT_WAIT_MS = 45_000;
/** Browser PUT of an avatar (MAX_AVATAR_BYTES). */
export const AVATAR_PUT_WAIT_MS = 15_000;
/** ffmpeg decode of a clip up to MAX_VIDEO_SECONDS. */
export const FFMPEG_WAIT_MS = 15_000;
/** ffmpeg grab of one still. */
export const FFMPEG_FRAME_WAIT_MS = 8_000;
/** Spotify Basic Pitch on a clip up to MAX_VIDEO_SECONDS (about realtime on CPU). */
export const PITCH_PYTHON_WAIT_MS = 90_000;
/** analyze.py: ffmpeg + librosa/stdlib on that same clip. */
export const ANALYZE_PYTHON_WAIT_MS = 45_000;
/** Student-facing wait for a practice pitch check. After this, stop the spinner and let them send. */
export const PITCH_CHECK_WAIT_MS = 60_000;
/**
 * Gemini Files API PROCESSING → ACTIVE. js-genai HttpOptions.timeout is per HTTP attempt
 * with no SDK default. This repo polled 90 × 2s before the blanket 60s.
 */
export const GEMINI_FILE_READY_WAIT_MS = 180_000;
/** Gemini Files API upload of a take/tutorial (up to 60MB). */
export const GEMINI_UPLOAD_WAIT_MS = 120_000;
/** One files.get metadata poll. */
export const GEMINI_FILE_GET_WAIT_MS = 10_000;
/** generateContent with a 90s take (extract/compare). Flash on video often exceeds 60s. */
export const GEMINI_VIDEO_WAIT_MS = 120_000;
/** Train generateContent (Pro, HIGH thinking, long tutorial). Worker stale reclaim is 20 min. */
export const GEMINI_TRAIN_WAIT_MS = 600_000;
/** generateContent on one still (fret). MINIMAL thinking. */
export const GEMINI_IMAGE_WAIT_MS = 20_000;
/** Up to 8 fret frames. */
export const FRET_LABEL_WAIT_MS = 8 * GEMINI_IMAGE_WAIT_MS;
/** Draft letter: Flash, MINIMAL thinking, max 2048 tokens. Teacher UI used 25s before the blanket 60s. */
export const GEMINI_DRAFT_WAIT_MS = 25_000;
/** Teacher analyze spinner: file ready + one video generate. Practice uses PITCH_CHECK_WAIT_MS. */
export const ANALYZE_WAIT_MS = GEMINI_FILE_READY_WAIT_MS + GEMINI_VIDEO_WAIT_MS;
export const DEFAULT_GEMINI_MODEL_TRAIN = "gemini-3.1-pro-preview";
export const DEFAULT_GEMINI_MODEL_COMPARE = "gemini-3.5-flash";
export const MAX_VIDEO_BYTES = 60 * 1024 * 1024;
export const MAX_SHEET_BYTES = 20 * 1024 * 1024;
export const MAX_VIDEO_SECONDS = 90;
export const MAX_CLIP_SECONDS = 120;
export const MAX_CLIP_BYTES = 40 * 1024 * 1024;
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
export const MAX_ACTIVE_VOICE_SAMPLES = 40;
export const TEACHER_COOKIE = "teacher_session";
export const STUDENT_COOKIE = "student_token";
export const STUDENT_SESSION_COOKIE = "student_session";
export const ADMIN_COOKIE = "admin_session";
export const LOCALE_COOKIE = "locale";
export const THEME_COOKIE = "theme";
export const MEDIA_BUCKET = process.env.SUPABASE_MEDIA_BUCKET ?? "media";

export const CONSENT_LINE_VI =
  "Video được gửi cho thầy/cô này và dùng để cải thiện nhận xét. Có thể yêu cầu xóa.";
export const UNDER18_LINE_VI =
  "Tôi trên 18 tuổi hoặc có sự đồng ý của phụ huynh.";
