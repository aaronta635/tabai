export const CONSENT_VERSION = "2026-09-v1";
export const PIPELINE_VERSION = "audio-metrics-v1";
export const PROMPT_VERSION = "draft_reply_vi-v1";
export const MAX_VIDEO_BYTES = 60 * 1024 * 1024;
export const MAX_VIDEO_SECONDS = 90;
export const MAX_ACTIVE_VOICE_SAMPLES = 40;
export const TEACHER_COOKIE = "teacher_session";
export const STUDENT_COOKIE = "student_token";
export const ADMIN_COOKIE = "admin_session";
export const LOCALE_COOKIE = "locale";
export const MEDIA_BUCKET = process.env.SUPABASE_MEDIA_BUCKET ?? "media";

export const CONSENT_LINE_VI =
  "Video được gửi cho thầy/cô này và dùng để cải thiện nhận xét. Có thể yêu cầu xóa.";
export const UNDER18_LINE_VI =
  "Tôi trên 18 tuổi hoặc có sự đồng ý của phụ huynh.";
