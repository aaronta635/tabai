"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  approveStudent,
  markOpened,
  peekDraft,
  requestDraft,
  sendReply,
  setIssueVerdict,
} from "@/app/teacher/actions";
import { DeleteTakeButton } from "@/components/teacher/delete-take-button";
import { RevertReplyButton } from "@/components/teacher/revert-reply-button";
import { FactBars } from "@/components/teacher/fact-bars";
import { NUDGE_MESSAGE } from "@/lib/deep-links";
import { requiredText } from "@/lib/forms";
import { formatClock, type FactVerdict, type ObservationMarker } from "@/lib/score-model";

export type QueueItem = {
  id: string;
  kind: "pending" | "unanswered" | "answered" | "practice";
  studentId: string;
  studentName: string;
  pieceTitle: string;
  waitingMs: number;
  mediaId: string | null;
  draft: string | null;
  draftAt?: string | null;
  reply: string | null;
  teacherPick: boolean;
  skipReason: string | null;
  nudgeUrl: string | null;
  submissionId: string | null;
  markers: ObservationMarker[];
  positives?: string[];
  pitchJudge?: "ok" | "weak";
  submissionKind?: "take" | "practice" | "overdub" | null;
  studentNote?: string | null;
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
  hideTabs = false,
}: {
  tab: "unanswered" | "pending" | "answered" | "practice";
  labels: { unanswered: string; pending: string; answered: string; practice: string };
  counts: { unanswered: number; pending: number; answered: number; practice: number };
  items: QueueItem[];
  hideTabs?: boolean;
}) {
  const t = useTranslations("teacher");
  const [index, setIndex] = useState(0);
  const [letter, setLetter] = useState("");
  const [highlightAt, setHighlightAt] = useState<number | null>(null);
  const [fast, setFast] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const letterRef = useRef<HTMLTextAreaElement>(null);
  const letterDirty = useRef(false);
  const verdictQueue = useRef(Promise.resolve());
  const verdictTicket = useRef<Record<number, number>>({});
  const verdictItem = useRef<string | null>(null);
  const [pending, start] = useTransition();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [verdicts, setVerdicts] = useState<Record<number, FactVerdict>>({});

  const item = items[index] ?? null;

  const factsReady =
    !item ||
    item.markers.length === 0 ||
    item.markers.every((marker) => {
      const verdict = verdicts[marker.index] ?? marker.verdict;
      return verdict === "true" || verdict === "false";
    });

  const submitReply = useCallback(async (submissionId: string, text: string, moment: number | null) => {
    if (!requiredText(text)) {
      setActionError(t("replyRequired"));
      return;
    }
    const result = await sendReply({
      submissionId,
      text,
      grade: null,
      highlightStartS: moment,
      keyPoint: text,
    });
    if (result && "error" in result) {
      setActionError(
        result.error === "stale_item" ? t("staleReply") : result.error === "bad_grade" ? t("badGrade") : t("replyRequired"),
      );
      return;
    }
    setActionError(null);
    setIndex((i) => i + 1);
  }, [t]);

  useEffect(() => {
    setIndex(0);
  }, [tab, items.length]);

  useEffect(() => {
    if (!item) return;
    const next: Record<number, FactVerdict> = {};
    for (const marker of item.markers) next[marker.index] = marker.verdict ?? null;
    setVerdicts(next);
    letterDirty.current = false;
    setLetter(item.draft ?? "");
    setHighlightAt(null);
    setActionError(null);
    if (item.submissionId && item.kind === "unanswered") {
      void markOpened(item.submissionId);
    }
  }, [item?.id]);

  useEffect(() => {
    if (!item?.submissionId || item.kind !== "unanswered") return;
    let cancelled = false;
    const tick = async () => {
      if (letterDirty.current) return;
      const latest = await peekDraft(item.submissionId!);
      if (cancelled || letterDirty.current || !latest.text) return;
      setLetter(latest.text);
    };
    void tick();
    const id = window.setInterval(() => void tick(), 2000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [item?.id, item?.submissionId, item?.kind]);

  useEffect(() => {
    if (!item?.submissionId || !factsReady || item.markers.length === 0) return;
    if (letterDirty.current) return;
    void requestDraft(item.submissionId);
    const id = window.setInterval(() => {
      if (letterDirty.current) return;
      void requestDraft(item.submissionId!);
    }, 8000);
    return () => window.clearInterval(id);
  }, [item?.id, item?.submissionId, factsReady, item?.markers.length]);

  useEffect(() => {
    if (!item?.mediaId) {
      setVideoUrl(null);
      return;
    }
    const mediaId = item.mediaId;
    let cancelled = false;
    setVideoUrl(null);
    void fetch(`/api/media/url?mediaId=${encodeURIComponent(mediaId)}`)
      .then((res) => res.json() as Promise<{ url?: string }>)
      .then((data) => {
        if (!cancelled && typeof data.url === "string") setVideoUrl(data.url);
      })
      .catch(() => {
        if (!cancelled) setVideoUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [item?.id, item?.mediaId]);

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
      if (event.key === "e" && !inField && item?.kind === "unanswered") {
        event.preventDefault();
        queueMicrotask(() => letterRef.current?.focus());
      }
      if (event.key === "Enter" && !event.shiftKey) {
        if (inField && !event.metaKey && !event.ctrlKey) return;
        if (item?.kind === "unanswered" && item.submissionId) {
          event.preventDefault();
          start(async () => {
            await submitReply(item.submissionId!, letter, highlightAt);
          });
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, letter, highlightAt, submitReply]);

  const grouped = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of items) {
      map.set(row.pieceTitle, (map.get(row.pieceTitle) ?? 0) + 1);
    }
    return map;
  }, [items]);

  return (
    <div>
      {hideTabs ? null : (
      <div className="flex gap-2 text-sm">
        {(["unanswered", "pending", "answered", "practice"] as const).map((key) => (
          <Link
            key={key}
            href={
              key === "practice"
                ? "/teacher/submissions?kind=practice"
                : key === "answered"
                  ? "/teacher/submissions?status=answered"
                  : key === "pending"
                    ? "/teacher/classes"
                    : "/teacher/submissions"
            }
            className={`rounded-full px-3 py-1 ${tab === key ? "bg-beat text-white" : "bg-cream ring-1 ring-ink/10"}`}
          >
            {labels[key]} {counts[key]}
          </Link>
        ))}
      </div>
      )}

      {tab === "unanswered" && grouped.size > 0 ? (
        <p className="mt-3 text-xs text-ink-soft">
          {[...grouped.entries()].map(([title, n]) => `${title} (${n})`).join(" · ")}
        </p>
      ) : null}

      {!item ? (
        <p className="mt-10 text-ink-soft">{tab === "pending" ? t("emptyPending") : t("emptyQueue")}</p>
      ) : (
        <article className="lms-card teacher-review mt-6 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-2xl">{item.studentName}</p>
              <p className="text-sm text-ink-soft">
                {item.pieceTitle}
                {item.submissionKind === "overdub" ? ` · ${t("overdub")}` : item.submissionKind === "practice" ? ` · ${t("practice")}` : ""}
                {" · "}
                {waitLabel(item.waitingMs)} {t("waiting")}
              </p>
            </div>
          </div>

          {item.studentNote ? (
            <div className="mt-3">
              <p className="field-label">{t("studentNote")}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{item.studentNote}</p>
            </div>
          ) : null}

          {videoUrl ? (
            <video ref={videoRef} src={videoUrl} controls playsInline className="mt-4 w-full rounded-xl bg-black" />
          ) : (
            <p className="mt-4 text-sm text-ink-soft">{item.mediaId ? "…" : "No video"}</p>
          )}

          <FactBars
            resetKey={item.id}
            markers={item.markers}
            verdicts={verdicts}
            positives={item.positives ?? []}
            judgeNote={item.pitchJudge === "weak" ? t("factCouldNotJudge") : null}
            copy={{
              help: t("factBarsHelp"),
              trueLabel: t("factTrue"),
              falseLabel: t("factFalse"),
              positives: t("factPositives"),
            }}
            onSeek={(tStart) => {
              const video = videoRef.current;
              if (!video) return;
              video.currentTime = tStart;
              void video.play();
            }}
            onVerdict={
              item.submissionId
                ? (issueIndex, verdict) => {
                    const submissionId = item.submissionId!;
                    const itemId = item.id;
                    setVerdicts((prev) => ({ ...prev, [issueIndex]: verdict }));
                    const mine = (verdictTicket.current[issueIndex] ?? 0) + 1;
                    verdictTicket.current[issueIndex] = mine;
                    verdictItem.current = itemId;
                    verdictQueue.current = verdictQueue.current.then(async () => {
                      try {
                        const result = await setIssueVerdict({ submissionId, issueIndex, verdict });
                        if (verdictItem.current !== itemId || verdictTicket.current[issueIndex] !== mine) return;
                        if (result && "latestVerdictAt" in result && result.latestVerdictAt && !letterDirty.current) {
                          void requestDraft(submissionId);
                        }
                      } catch {
                        if (verdictItem.current !== itemId || verdictTicket.current[issueIndex] !== mine) return;
                      }
                    });
                  }
                : undefined
            }
          />

          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" aria-pressed={fast} className="teacher-speed rounded-full border border-ink/20 px-3 py-1 text-sm" onClick={() => setFast((v) => !v)}>
              {t("speed")} {fast ? "on" : "off"}
            </button>
            {item.nudgeUrl ? (
              <a
                className="rounded-full border border-ink/20 px-3 py-1 text-sm"
                href={item.nudgeUrl}
                target="_blank"
                rel="noreferrer"
              >
                {t("nudge")}
              </a>
            ) : null}
          </div>
          {item.nudgeUrl ? <p className="mt-2 text-xs text-ink-soft">{NUDGE_MESSAGE}</p> : null}

          {item.kind === "pending" ? (
            <button
              type="button"
              disabled={pending}
              className="mt-5 w-full rounded-xl bg-beat py-3 text-white"
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
            <div className="teacher-feedback mt-5 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="chip"
                  disabled={!videoUrl}
                  onClick={() => {
                    const video = videoRef.current;
                    if (!video) return;
                    setHighlightAt(video.currentTime || 0);
                  }}
                >
                  {t("markMoment")}
                </button>
                {item.markers.map((marker) => (
                  <button
                    key={marker.index}
                    type="button"
                    className="chip"
                    onClick={() => setHighlightAt(marker.tStart)}
                  >
                    {t("useMoment", { time: formatClock(marker.tStart) })}
                  </button>
                ))}
              </div>
              {highlightAt != null ? (
                <p className="text-sm">{t("highlightAt", { time: formatClock(highlightAt) })}</p>
              ) : null}
              <label className="block">
                <span className="field-label">{t("letterLabel")}</span>
                <textarea
                  ref={letterRef}
                  value={letter}
                  onChange={(event) => {
                    letterDirty.current = true;
                    setLetter(event.target.value);
                  }}
                  rows={8}
                  className="field mt-1.5 w-full"
                />
              </label>
              {actionError ? <p className="text-sm text-danger">{actionError}</p> : null}
              <button
                type="button"
                disabled={pending}
                className="btn w-full"
                onClick={() =>
                  start(async () => {
                    if (!item.submissionId) return;
                    await submitReply(item.submissionId, letter, highlightAt);
                  })
                }
              >
                {t("send")}
              </button>
            </div>
          ) : null}

          {item.kind === "answered" && item.reply ? (
            <p className="mt-5 leading-relaxed">{item.reply}</p>
          ) : null}

          <div className="desk-actions">
            {item.kind === "answered" && item.reply && item.submissionId ? (
              <RevertReplyButton
                submissionId={item.submissionId}
                label={t("revertReply")}
                confirmLabel={t("revertReplyConfirm")}
              />
            ) : null}
            {item.submissionId ? (
              <DeleteTakeButton
                submissionId={item.submissionId}
                label={t("deleteTake")}
                confirmLabel={t("deleteTakeConfirm")}
                className="desk-action is-danger"
                afterHref={index + 1 >= items.length ? "/teacher/submissions" : undefined}
                onDeleted={() => {
                  if (index + 1 < items.length) setIndex((i) => i + 1);
                }}
              />
            ) : null}
          </div>
        </article>
      )}
    </div>
  );
}
