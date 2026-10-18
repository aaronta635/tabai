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
  skipSubmission,
} from "@/app/teacher/actions";
import { DeleteTakeButton } from "@/components/teacher/delete-take-button";
import { RevertReplyButton } from "@/components/teacher/revert-reply-button";
import { FactBars } from "@/components/teacher/fact-bars";
import { NUDGE_MESSAGE } from "@/lib/deep-links";
import { requiredText } from "@/lib/forms";
import { joinStoryLetter } from "@/lib/report";
import {
  draftCoversFactVerdicts,
  formatClock,
  latestFactVerdictAt,
  type FactVerdict,
  type ObservationMarker,
} from "@/lib/score-model";

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
  const [progressNote, setProgressNote] = useState("");
  const [keyPoint, setKeyPoint] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [highlightAt, setHighlightAt] = useState<number | null>(null);
  const [grade, setGrade] = useState("");
  const [fast, setFast] = useState(false);
  const [skipOpen, setSkipOpen] = useState(false);
  const [skipReason, setSkipReason] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLTextAreaElement>(null);
  const verdictQueue = useRef(Promise.resolve());
  const verdictTicket = useRef<Record<number, number>>({});
  const verdictItem = useRef<string | null>(null);
  const [pending, start] = useTransition();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [verdicts, setVerdicts] = useState<Record<number, FactVerdict>>({});
  const [polledDraft, setPolledDraft] = useState<{ text: string; createdAt: string } | null>(null);
  const [localLatestVerdictAt, setLocalLatestVerdictAt] = useState<string | null>(null);
  const [minDraftAt, setMinDraftAt] = useState<string | null>(null);
  const [waitStarted, setWaitStarted] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState(0);
  const [ownLetter, setOwnLetter] = useState(false);

  const item = items[index] ?? null;

  const factsReady =
    !item ||
    item.markers.length === 0 ||
    item.markers.every((marker) => {
      const verdict = verdicts[marker.index] ?? marker.verdict;
      return verdict === "true" || verdict === "false";
    });
  const latestVerdictAt = localLatestVerdictAt ?? (item ? latestFactVerdictAt(item.markers) : null);
  const shownDraftAt = polledDraft?.createdAt ?? item?.draftAt ?? null;
  const hasFreshDraft = Boolean(
    item &&
      draftCoversFactVerdicts(shownDraftAt, latestVerdictAt, item.markers.length) &&
      (!minDraftAt || (shownDraftAt && shownDraftAt > minDraftAt)),
  );
  const waitingForDraft = Boolean(item && item.kind === "unanswered" && item.markers.length > 0 && factsReady && !hasFreshDraft);
  const timedOut = Boolean(waitStarted && nowTick >= 0 && Date.now() - waitStarted > 90_000);
  const letterLocked = Boolean(
    item && item.kind === "unanswered" && item.markers.length > 0 && (!factsReady || (!hasFreshDraft && !timedOut)),
  );
  const letterOpen = !letterLocked || ownLetter;
  const letterText = polledDraft?.text ?? (hasFreshDraft ? item?.draft ?? "" : "");

  const submitReply = useCallback(async (
    submissionId: string,
    lines: { progress: string; keyPoint: string; nextStep: string },
    mark: string,
    moment: number | null,
  ) => {
    const letter = joinStoryLetter({ progress: lines.progress, keyPoint: lines.keyPoint, nextStep: lines.nextStep });
    if (!requiredText(letter)) {
      setActionError(t("replyRequired"));
      return;
    }
    const result = await sendReply({
      submissionId,
      text: letter,
      grade: mark || null,
      highlightStartS: moment,
      progressNote: lines.progress,
      keyPoint: lines.keyPoint,
      nextStep: lines.nextStep,
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
    setPolledDraft(null);
    setLocalLatestVerdictAt(null);
    setMinDraftAt(null);
    setWaitStarted(null);
    setOwnLetter(false);
    setProgressNote("");
    setKeyPoint("");
    setNextStep("");
    setHighlightAt(null);
    setGrade("");
    setActionError(null);
    if (item.submissionId && item.kind === "unanswered") {
      void markOpened(item.submissionId);
    }
  }, [item?.id]);

  useEffect(() => {
    if (waitingForDraft && waitStarted == null) setWaitStarted(Date.now());
    if (!waitingForDraft) setWaitStarted(null);
  }, [waitingForDraft, waitStarted]);

  useEffect(() => {
    if (!waitingForDraft) return;
    const id = window.setInterval(() => setNowTick((tick) => tick + 1), 5000);
    return () => window.clearInterval(id);
  }, [waitingForDraft]);

  useEffect(() => {
    if (!item?.submissionId || !waitingForDraft) return;
    let cancelled = false;
    const tick = async () => {
      const latest = await peekDraft(item.submissionId!);
      if (cancelled || !latest.createdAt || !latest.text) return;
      if (!draftCoversFactVerdicts(latest.createdAt, latestVerdictAt, item.markers.length)) return;
      setPolledDraft({ text: latest.text, createdAt: latest.createdAt });
    };
    void tick();
    const id = window.setInterval(() => void tick(), 2000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [item?.id, item?.submissionId, waitingForDraft, latestVerdictAt, item?.markers.length]);

  useEffect(() => {
    if (!item?.submissionId) return;
    if (!factsReady || item.markers.length === 0 || hasFreshDraft) return;
    void requestDraft(item.submissionId);
    const id = window.setInterval(() => {
      void requestDraft(item.submissionId!);
    }, 8000);
    return () => window.clearInterval(id);
  }, [item?.id, item?.submissionId, factsReady, item?.markers.length, hasFreshDraft]);

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
      if (event.key === "e" && !inField && letterOpen) {
        event.preventDefault();
        queueMicrotask(() => progressRef.current?.focus());
      }
      if (event.key === "Enter" && !event.shiftKey) {
        if (inField && !event.metaKey && !event.ctrlKey) return;
        if (!letterOpen) return;
        if (item?.kind === "unanswered" && item.submissionId) {
          event.preventDefault();
          start(async () => {
            await submitReply(
              item.submissionId!,
              { progress: progressNote, keyPoint, nextStep },
              grade,
              highlightAt,
            );
          });
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, progressNote, keyPoint, nextStep, highlightAt, grade, submitReply, letterOpen]);

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
        <article className="lms-card mt-6 p-4">
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
                    setPolledDraft(null);
                    const mine = (verdictTicket.current[issueIndex] ?? 0) + 1;
                    verdictTicket.current[issueIndex] = mine;
                    verdictItem.current = itemId;
                    verdictQueue.current = verdictQueue.current.then(async () => {
                      try {
                        const result = await setIssueVerdict({ submissionId, issueIndex, verdict });
                        if (verdictItem.current !== itemId || verdictTicket.current[issueIndex] !== mine) return;
                        if (result && "latestVerdictAt" in result && result.latestVerdictAt) {
                          setLocalLatestVerdictAt(result.latestVerdictAt);
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
            <button type="button" className="rounded-full border border-ink/20 px-3 py-1 text-sm" onClick={() => setFast((v) => !v)}>
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
            <div className="mt-5 space-y-3">
              {!letterOpen ? (
                <p className="fact-draft-wait">
                  {factsReady ? t("factDraftWait") : t("factDraftGate")}
                </p>
              ) : (
                <>
                  {timedOut && !hasFreshDraft ? (
                    <p className="fact-draft-wait">{t("factDraftTimeout")}</p>
                  ) : null}
                  {letterText ? (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">{letterText}</p>
                  ) : null}
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
                    <span className="field-label">{t("progressLine")}</span>
                    <textarea
                      ref={progressRef}
                      value={progressNote}
                      onChange={(event) => setProgressNote(event.target.value)}
                      rows={2}
                      className="field mt-1.5 w-full"
                    />
                  </label>
                  <label className="block">
                    <span className="field-label">{t("keyLine")}</span>
                    <textarea
                      value={keyPoint}
                      onChange={(event) => setKeyPoint(event.target.value)}
                      rows={2}
                      className="field mt-1.5 w-full"
                    />
                  </label>
                  <label className="block">
                    <span className="field-label">{t("nextLine")}</span>
                    <textarea
                      value={nextStep}
                      onChange={(event) => setNextStep(event.target.value)}
                      rows={2}
                      className="field mt-1.5 w-full"
                    />
                  </label>
                </>
              )}
              {actionError ? <p className="text-sm text-danger">{actionError}</p> : null}
              {!letterOpen ? (
                <button
                  type="button"
                  className="desk-action"
                  onClick={() => {
                    setOwnLetter(true);
                    setProgressNote("");
                    setKeyPoint("");
                    setNextStep("");
                    queueMicrotask(() => progressRef.current?.focus());
                  }}
                >
                  {t("writeYourself")}
                </button>
              ) : (
              <>
              <label className="block">
                <span className="field-label">{t("grade")}</span>
                <select
                  className="field mt-1.5"
                  value={grade}
                  onChange={(event) => setGrade(event.target.value)}
                >
                  <option value="">{t("gradeNone")}</option>
                  {["A", "B", "C", "D", "F"].map((mark) => (
                    <option key={mark} value={mark}>
                      {mark}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                disabled={pending}
                className="btn w-full"
                onClick={() =>
                  start(async () => {
                    if (!item.submissionId) return;
                    await submitReply(
                      item.submissionId,
                      { progress: progressNote, keyPoint, nextStep },
                      grade,
                      highlightAt,
                    );
                  })
                }
              >
                {t("send")}
              </button>
              </>
              )}
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
                    className="field mt-0"
                    required
                  />
                  <button type="submit" className="desk-action">
                    {t("skip")}
                  </button>
                </form>
              ) : null}
            </div>
          ) : null}

          {item.kind === "answered" && item.reply ? (
            <p className="mt-5 leading-relaxed">{item.reply}</p>
          ) : null}

          <div className="desk-actions">
            {item.kind === "unanswered" && letterOpen ? (
              <>
                <button
                  type="button"
                  className="desk-action"
                  onClick={() => {
                    progressRef.current?.focus();
                  }}
                >
                  {t("edit")}
                </button>
                <button
                  type="button"
                  className="desk-action"
                  onClick={() => {
                    setPolledDraft(null);
                    setMinDraftAt(shownDraftAt ?? new Date().toISOString());
                    setProgressNote("");
                    setKeyPoint("");
                    setNextStep("");
                    if (item.submissionId) void requestDraft(item.submissionId);
                  }}
                >
                  {t("rewrite")}
                </button>
              </>
            ) : null}
            {item.kind === "unanswered" ? (
              <button type="button" className="desk-action" onClick={() => setSkipOpen(true)}>
                {t("skip")}
              </button>
            ) : null}
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
