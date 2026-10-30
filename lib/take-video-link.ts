import { MEDIA_URL_MAX_IDS } from "@/lib/media-url-guard";

const PREFIX = "para-take-video:";
const TTL_MS = 30 * 60 * 1000;

type StoredLink = { url: string; expiresAt: number };

export function readTakeVideo(mediaId: string): string | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PREFIX + mediaId);
    if (!raw) return null;
    const stored = JSON.parse(raw) as StoredLink;
    if (typeof stored.url !== "string" || stored.expiresAt < Date.now()) {
      sessionStorage.removeItem(PREFIX + mediaId);
      return null;
    }
    return stored.url;
  } catch {
    return null;
  }
}

export function writeTakeVideo(mediaId: string, url: string) {
  if (typeof sessionStorage === "undefined") return;
  const stored: StoredLink = { url, expiresAt: Date.now() + TTL_MS };
  sessionStorage.setItem(PREFIX + mediaId, JSON.stringify(stored));
}

export async function fetchTakeVideo(mediaId: string): Promise<string | null> {
  const cached = readTakeVideo(mediaId);
  if (cached) return cached;
  const res = await fetch(`/api/media/url?mediaId=${encodeURIComponent(mediaId)}`);
  if (!res.ok) return null;
  const data = (await res.json()) as { url?: string };
  if (typeof data.url !== "string") return null;
  writeTakeVideo(mediaId, data.url);
  return data.url;
}

async function fetchTakeVideoBatch(mediaIds: string[]) {
  const params = new URLSearchParams();
  for (const id of mediaIds) params.append("mediaId", id);
  const res = await fetch(`/api/media/url?${params.toString()}`);
  if (!res.ok) return;
  const data = (await res.json()) as { urls?: Record<string, string> };
  const urls = data.urls ?? {};
  for (const id of mediaIds) {
    const url = urls[id];
    if (typeof url === "string") writeTakeVideo(id, url);
  }
}

export async function prefetchTakeVideos(mediaIds: string[], signal?: { cancelled: boolean }) {
  const pending = [...new Set(mediaIds)].filter((id) => id && !readTakeVideo(id));
  if (pending.length === 1) {
    const only = pending[0];
    if (!only) return;
    try {
      await fetchTakeVideo(only);
    } catch {
      // The take page asks again if this link never landed.
    }
    return;
  }
  for (let start = 0; start < pending.length; start += MEDIA_URL_MAX_IDS) {
    if (signal?.cancelled) return;
    const chunk = pending.slice(start, start + MEDIA_URL_MAX_IDS);
    try {
      await fetchTakeVideoBatch(chunk);
    } catch {
      // The take page asks again if this link never landed.
    }
  }
}
