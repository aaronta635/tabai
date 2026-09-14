"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  approveStudent,
  markOpened,
  sendReply,
  skipSubmission,
  togglePick,
} from "@/app/teacher/actions";
import { NUDGE_MESSAGE } from "@/lib/deep-links";

export type QueueItem = {
  id: string;
  kind: "pending" | "unanswered" | "answered";
  studentId: string;
  studentName: string;
  pieceTitle: string;
  waitingMs: number;
  videoUrl: string | null;
  draft: string | null;
  reply: string | null;
  teacherPick: boolean;
  skipReason: string | null;
  nudgeUrl: string | null;
  submissionId: string | null;
};

function waitLabel(ms: number) {
  const minutes = Math.max(0, Math.round(ms / 60000));
  if (minutes < 60) return `${minutes} phút`;
  const hours = Math.round(minutes / 60);
  return `${hours} giờ`;
}

export function QueueClient({
  tab,
  labels,
  counts,
  items,
}: {
  tab: "unanswered" | "pending" | "answered";
  labels: { unanswered: string; pending: string; answered: string };
  counts: { unanswered: number; pending: number; answered: number };
  items: QueueItem[];
}) {
  const t = useTranslations("teacher");
  const [index, setIndex] = useState(0);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const [fast, setFast] = useState(false);
  const [skipOpen, setSkipOpen] = useState(false);
  const [skipReason, setSkipReason] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const boxRef = useRef<HTMLTextAreaElement>(null);
  const [pending, start] = useTransition();

  const item = items[index] ?? null;

  useEffect(() => {
    setIndex(0);
  }, [tab, items.length]);

  useEffect(() => {
    if (!item) return;
    setText(item.draft ?? item.reply ?? "");
    setEditing(false);
    if (item.submissionId && item.kind === "unanswered") {
      void markOpened(item.submissionId);
    }
  }, [item?.id]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = fast ? 1.5 : 1;
  }, [fast, item?.id]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      const inField = target.tagName === "TEXTAREA" || target.tagName === "INPUT";
      if (event.code === "Space" && !inField) {
        event.preventDefault();
        const video = videoRef.current;
        if (!video) return;
        if (video.paused) void video.play();
        else video.pause();
      }
      if (event.key === "e" && !inField) {
        event.preventDefault();
        setEditing(true);
        queueMicrotask(() => boxRef.current?.focus());
      }
      if (event.key === "Enter" && !event.shiftKey) {
        if (inField && !event.metaKey && !event.ctrlKey) return;
        if (item?.kind === "unanswered" && item.submissionId) {
          event.preventDefault();
          start(async () => {
            await sendReply({ submissionId: item.submissionId!, text });
            setIndex((i) => i + 1);
          });
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, text]);

  const grouped = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of items) {
      map.set(row.pieceTitle, (map.get(row.pieceTitle) ?? 0) + 1);
    }
    return map;
  }, [items]);

  return (
    <div>
      <div className="flex gap-2 text-sm">
        {(["unanswered", "pending", "answered"] as const).map((key) => (
          <Link
            key={key}
            href={`/teacher/queue?tab=${key}`}
            className={`rounded-full px-3 py-1 ${tab === key ? "bg-forest text-white" : "bg-night-card"}`}
          >
            {labels[key]} {counts[key]}
          </Link>
        ))}
      </div>

      {tab === "unanswered" && grouped.size > 0 ? (
        <p className="mt-3 text-xs text-bone/50">
          {[...grouped.entries()].map(([title, n]) => `${title} (${n})`).join(" · ")}
        </p>
      ) : null}

      {!item ? (
        <p className="mt-10 text-bone/70">{tab === "pending" ? t("emptyPending") : t("emptyQueue")}</p>
      ) : (
        <article className="mt-6 rounded-2xl bg-night-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-2xl">{item.studentName}</p>
              <p className="text-sm text-bone/60">
                {item.pieceTitle} · {waitLabel(item.waitingMs)} {t("waiting")}
              </p>
            </div>
            {item.teacherPick ? (
              <span className="rounded-full bg-brass/20 px-2 py-1 text-xs text-brass">{t("picked")}</span>
            ) : null}
          </div>

          {item.videoUrl ? (
            <video ref={videoRef} src={item.videoUrl} controls playsInline className="mt-4 w-full rounded-xl bg-black" />
          ) : (
            <p className="mt-4 text-sm text-bone/50">No video</p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="rounded-full border border-bone/20 px-3 py-1 text-sm" onClick={() => setFast((v) => !v)}>
              {t("speed")} {fast ? "on" : "off"}
            </button>
            {item.nudgeUrl ? (
              <a
                className="rounded-full border border-bone/20 px-3 py-1 text-sm"
                href={item.nudgeUrl}
                target="_blank"
                rel="noreferrer"
              >
                {t("nudge")}
              </a>
            ) : null}
          </div>
          {item.nudgeUrl ? <p className="mt-2 text-xs text-bone/40">{NUDGE_MESSAGE}</p> : null}

          {item.kind === "pending" ? (
            <button
              type="button"
              disabled={pending}
              className="mt-5 w-full rounded-xl bg-forest py-3 text-white"
              onClick={() =>
                start(async () => {
                  await approveStudent(item.studentId);
                  setIndex((i) => i + 1);
                })
              }
            >
              {t("approve")}
            </button>
          ) : null}

          {item.kind === "unanswered" ? (
            <div className="mt-5 space-y-3">
              <textarea
                ref={boxRef}
                value={text}
                readOnly={!editing && Boolean(item.draft)}
                onChange={(e) => setText(e.target.value)}
                onFocus={() => setEditing(true)}
                rows={6}
                className="w-full rounded-xl bg-night p-3 leading-relaxed"
              />
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={pending}
                  className="rounded-xl bg-forest py-3 text-white"
                  onClick={() =>
                    start(async () => {
                      if (!item.submissionId) return;
                      await sendReply({ submissionId: item.submissionId, text });
                      setIndex((i) => i + 1);
                    })
                  }
                >
                  {t("send")}
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-bone/20 py-3"
                  onClick={() => {
                    setEditing(true);
                    boxRef.current?.focus();
                  }}
                >
                  {t("edit")}
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-bone/20 py-3"
                  onClick={() => {
                    setText("");
                    setEditing(true);
                    boxRef.current?.focus();
                  }}
                >
                  {t("rewrite")}
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-bone/20 py-3"
                  onClick={() => setSkipOpen(true)}
                >
                  {t("skip")}
                </button>
              </div>
              {skipOpen ? (
                <form
                  className="space-y-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!item.submissionId) return;
                    start(async () => {
                      await skipSubmission(item.submissionId!, skipReason);
                      setSkipOpen(false);
                      setSkipReason("");
                      setIndex((i) => i + 1);
                    });
                  }}
                >
                  <input
                    value={skipReason}
                    onChange={(e) => setSkipReason(e.target.value)}
                    placeholder={t("skipReason")}
                    className="w-full rounded-xl bg-night px-3 py-2"
                    required
                  />
                  <button type="submit" className="text-sm text-brass">
                    {t("skip")}
                  </button>
                </form>
              ) : null}
              {item.submissionId ? (
                <button
                  type="button"
                  className="text-sm text-brass"
                  onClick={() => start(async () => togglePick(item.submissionId!))}
                >
                  {t("pick")}
                </button>
              ) : null}
            </div>
          ) : null}

          {item.kind === "answered" && item.reply ? (
            <div className="mt-5">
              <p className="leading-relaxed">{item.reply}</p>
              {item.submissionId ? (
                <button
                  type="button"
                  className="mt-3 text-sm text-brass"
                  onClick={() => start(async () => togglePick(item.submissionId!))}
                >
                  {item.teacherPick ? t("picked") : t("pick")}
                </button>
              ) : null}
            </div>
          ) : null}
        </article>
      )}
    </div>
  );
}
