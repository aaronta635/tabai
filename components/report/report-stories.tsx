"use client";

import { useEffect, useRef, useState } from "react";
import { HIGHLIGHT_SECONDS, type ReportStory } from "@/lib/report";

function HighlightClip({ token, start, fallback }: { token: string; start: number; fallback: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const opened = useRef(false);
  const [url, setUrl] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const end = start + HIGHLIGHT_SECONDS;

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/r/${encodeURIComponent(token)}/highlight`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("missing");
        return response.json() as Promise<{ url?: string }>;
      })
      .then((data) => {
        if (typeof data.url === "string" && data.url) setUrl(data.url);
        else setMissing(true);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setMissing(true);
      });
    return () => controller.abort();
  }, [token]);

  if (missing) return <h1 className="report-letter">{fallback}</h1>;
  if (!url) return null;

  return (
    <video
      ref={videoRef}
      className="report-clip"
      src={url}
      controls
      playsInline
      controlsList="nodownload"
      disablePictureInPicture
      onLoadedMetadata={(event) => {
        const video = event.currentTarget;
        if (start <= 0) {
          opened.current = true;
          void video.play().catch(() => undefined);
          return;
        }
        video.currentTime = start;
      }}
      onSeeked={(event) => {
        if (opened.current) return;
        opened.current = true;
        void event.currentTarget.play().catch(() => undefined);
      }}
      onPlay={(event) => {
        if (event.currentTarget.currentTime >= end - 0.05) {
          event.currentTarget.currentTime = start;
        }
      }}
      onTimeUpdate={(event) => {
        const video = event.currentTarget;
        if (video.currentTime > end) {
          video.pause();
          video.currentTime = end;
        }
      }}
    />
  );
}

export function ReportStories({
  token,
  studentName,
  teacherName,
  stories,
  highlightFallback,
  pay,
  previousLabel,
  nextLabel,
}: {
  token: string;
  studentName: string;
  teacherName: string;
  stories: ReportStory[];
  highlightFallback: string;
  pay: { href: string; label: string } | null;
  previousLabel: string;
  nextLabel: string;
}) {
  const [index, setIndex] = useState(0);
  const story = stories[index] ?? stories[0];
  const last = index >= stories.length - 1;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight") setIndex((value) => Math.min(stories.length - 1, value + 1));
      if (event.key === "ArrowLeft") setIndex((value) => Math.max(0, value - 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stories.length]);

  if (!story) return null;
  const longLine = story.id !== "practice" && story.hero.length > 16;

  return (
    <section className="report-deck" data-tone={story.tone} aria-roledescription="story">
      <div className="report-deck-top">
        <p className="report-who">
          {studentName}
          <span>{teacherName}</span>
        </p>
        <div className="report-strings" role="progressbar" aria-valuemin={1} aria-valuemax={stories.length} aria-valuenow={index + 1} aria-valuetext={story.label}>
          {stories.map((item, itemIndex) => (
            <button
              key={item.id}
              type="button"
              className={itemIndex === index ? "is-on" : itemIndex < index ? "is-heard" : undefined}
              aria-label={item.label}
              aria-current={itemIndex === index ? "step" : undefined}
              onClick={() => setIndex(itemIndex)}
            />
          ))}
        </div>
      </div>

      <div className="report-slide" key={story.id}>
        <p className="report-label">{story.label}</p>
        {story.videoStart != null ? (
          <HighlightClip token={token} start={story.videoStart} fallback={highlightFallback} />
        ) : (
          <h1 className={longLine ? "report-letter" : "report-hero"}>{story.hero}</h1>
        )}
        {story.detail ? <p className="report-detail">{story.detail}</p> : null}
        {last && pay ? (
          <a className="btn report-pay" href={pay.href} target="_blank" rel="noopener noreferrer">
            {pay.label}
          </a>
        ) : null}
      </div>

      <div className="report-nav">
        <button type="button" className="report-nav-btn" onClick={() => setIndex((value) => Math.max(0, value - 1))} disabled={index === 0}>
          {previousLabel}
        </button>
        <button type="button" className="report-nav-btn" onClick={() => setIndex((value) => Math.min(stories.length - 1, value + 1))} disabled={last}>
          {nextLabel}
        </button>
      </div>
    </section>
  );
}
