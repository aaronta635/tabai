import { createSignedReadUrl, SIGNED_URL_CACHE_SECONDS } from "@/lib/storage";
import { cachedById } from "@/lib/teacher-cache";

type StoredMedia = { storagePath: string };

export function sheetView(path: string): "pdf" | "image" | "musicxml" | "file" {
  const name = path.split("/").pop()?.split("?")[0]?.toLowerCase() ?? "";
  if (/\.(png|jpe?g|webp)$/.test(name)) return "image";
  if (name.endsWith(".xml") || name.endsWith(".musicxml")) return "musicxml";
  if (name.endsWith(".pdf") || !name.includes(".")) return "pdf";
  return "file";
}

export function mediaStoragePath(media: unknown): string | null {
  if (!media || typeof media !== "object") return null;
  if (!("storagePath" in media)) return null;
  const path = (media as StoredMedia).storagePath;
  return typeof path === "string" ? path : null;
}

export function signedMediaTag(path: string) {
  return `media:${path}`;
}

export async function signedMediaUrl(path: string | null) {
  if (!path || path === "pending") return null;
  try {
    return await cachedById("signed-media", path, [], [signedMediaTag(path)], SIGNED_URL_CACHE_SECONDS, () =>
      createSignedReadUrl(path),
    );
  } catch {
    return null;
  }
}
