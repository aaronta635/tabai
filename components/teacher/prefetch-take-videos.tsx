"use client";

import { useEffect } from "react";
import { prefetchTakeVideos } from "@/lib/take-video-link";

export function PrefetchTakeVideos({ mediaIds }: { mediaIds: string[] }) {
  const key = mediaIds.join("\n");
  useEffect(() => {
    const signal = { cancelled: false };
    void prefetchTakeVideos(
      key.split("\n").filter(Boolean),
      signal,
    );
    return () => {
      signal.cancelled = true;
    };
  }, [key]);
  return null;
}
