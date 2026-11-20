"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { sendPracticeToTeacher } from "@/app/student/actions";
import { HeardPitchChips } from "@/components/teacher/heard-pitch-chips";
import { LoopSpeedPlayer } from "@/components/student/loop-speed-player";
import { MusicXmlSheet } from "@/components/student/musicxml-sheet";
import { SyncedTutorial } from "@/components/student/synced-tutorial";
import { TakeRecorder } from "@/components/student/take-recorder";
import { isOpenAnalyze } from "@/lib/analyze-status";
import { API_WAIT_MS, MAX_VIDEO_BYTES, MAX_VIDEO_SECONDS, MEDIA_PUT_WAIT_MS, PITCH_CHECK_WAIT_MS } from "@/lib/constants";
import type { SheetSyncJson } from "@/lib/score-model";
import { fetchWithServiceWait } from "@/lib/service-wait";
import { pitchCheckStillWaiting, pitchCheckTimedOut, type StudentPitchClip } from "@/lib/student-pitch";

type JsonBag = {
  error?: string;
  signedUrl?: string;
  mediaId?: string;
  submissionId?: string;
};

async function readJson(res: Response): Promise<JsonBag> {
  const text = await res.text();
  if (!text) return { error: res.statusText || "empty response" };
  try {
    return JSON.parse(text) as JsonBag;
  } catch {
    return { error: text };
  }
}

async function mediaDuration(file: File) {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<number>((resolve, reject) => {
      const video = document.createElement("video");
      const timer = window.setTimeout(() => {
        video.onloadedmetadata = null;
        video.onerror = null;
        reject(new Error("duration"));
      }, 4000);
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        window.clearTimeout(timer);
        resolve(video.duration || 0);
      };
      video.onerror = () => {
        window.clearTimeout(timer);
        reject(new Error("duration"));
      };
      video.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function submitPractice(code: string, file: File) {
  const sign = await fetchWithServiceWait(
    `/api/l/${code}/upload-url`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ size: file.size, contentType: file.type || "video/mp4" }),
    },
    API_WAIT_MS,
  );
  const signed = await readJson(sign);
  if (!sign.ok) throw new Error(signed.error ?? "sign failed");
  if (typeof signed.signedUrl !== "string" || typeof signed.mediaId !== "string") {
    throw new Error("sign failed");
  }
  const put = await fetchWithServiceWait(
    signed.signedUrl,
    {
      method: "PUT",
      headers: { "Content-Type": file.type || "video/mp4" },
      body: file,
    },
    MEDIA_PUT_WAIT_MS,
  );
  if (!put.ok) throw new Error("upload failed");
  const complete = await fetchWithServiceWait(
    `/api/l/${code}/complete`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mediaId: signed.mediaId, kind: "practice" }),
    },
    API_WAIT_MS,
  );
  const finished = await readJson(complete);
  if (!complete.ok) throw new Error(finished.error ?? "complete failed");
  if (typeof finished.submissionId !== "string") throw new Error("complete failed");
  return finished.submissionId;
}

function kindLabel(kind: StudentPitchClip["kind"], t: (key: "kindPractice" | "kindTake" | "kindOverdub") => string) {
  switch (kind) {
    case "practice":
      return t("kindPractice");
    case "take":
      return t("kindTake");
    case "overdub":
      return t("kindOverdub");
    default: {
      const never: never = kind;
      return never;
    }
  }
}

export function PracticeTakePitch({ clip }: { clip: StudentPitchClip }) {
  const router = useRouter();
  return <PracticeClipCard clip={clip} onSent={() => router.refresh()} />;
}

export function PracticeClipCard({
  clip,
  onSent,
}: {
  clip: StudentPitchClip;
  onSent: (next: StudentPitchClip) => void;
}) {
  const t = useTranslations("student");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState(clip.kind);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    setKind(clip.kind);
  }, [clip.kind]);
  useEffect(() => {
    setNow(Date.now());
  }, [clip.submittedAt, clip.job?.status]);
  useEffect(() => {
    if (!isOpenAnalyze(clip.job?.status)) return;
    const remaining = PITCH_CHECK_WAIT_MS - (Date.now() - Date.parse(clip.submittedAt));
    if (remaining <= 0) return;
    const timer = window.setTimeout(() => setNow(Date.now()), remaining);
    return () => window.clearTimeout(timer);
  }, [clip.submittedAt, clip.job?.status]);
  const waiting = pitchCheckStillWaiting(clip.job, clip.submittedAt, now);
  const timedOut = isOpenAnalyze(clip.job?.status) && pitchCheckTimedOut(clip.submittedAt, now);
  const sent = kind === "take" || kind === "overdub";

  async function send() {
    setError(null);
    setPending(true);
    try {
      const result = await sendPracticeToTeacher(clip.id);
      if ("error" in result) {
        setError(result.error === "analyze_open" ? t("practiceChecking") : t("practiceFailed"));
        return;
      }
      setKind("take");
      onSent({ ...clip, kind: "take" });
    } catch {
      setError(t("practiceFailed"));
    } finally {
      setPending(false);
    }
  }

  return (
    <article className="practice-clip">
      <header className="practice-clip-head">
        <p className="field-label">{kindLabel(kind, t)}</p>
        {clip.tempoBpm ? <p className="page-meta">{t("practiceTempo", { bpm: Math.round(clip.tempoBpm) })}</p> : null}
      </header>
      {waiting || timedOut || clip.log.line ? (
        <div className="analyze-status" data-kind={timedOut ? "failed" : clip.log.kind} role="status">
          <p>{waiting ? t("practiceChecking") : timedOut ? t("practiceTimedOut") : clip.log.line}</p>
          {waiting ? (
            <div className="analyze-bar" aria-hidden="true">
              <span />
            </div>
          ) : null}
          {clip.log.detail && !timedOut ? <p className="analyze-log">{clip.log.detail}</p> : null}
        </div>
      ) : null}
      {clip.pitchJudge === "weak" ? <p className="text-sm text-ink-soft">{t("practiceCouldNotJudge")}</p> : null}
      <HeardPitchChips
        notes={clip.notes}
        error={clip.pitchError}
        label={t("practiceHeard")}
        empty={t("practiceHeardNone")}
        errorLabel={t("practicePitchError")}
      />
      {clip.issues.length > 0 ? (
        <ul className="practice-clip-issues">
          {clip.issues.map((issue) => (
            <li key={`${issue.type}-${issue.label}`}>{issue.label}</li>
          ))}
        </ul>
      ) : null}
      {sent ? (
        <p className="text-sm">{t("practiceSent")}</p>
      ) : (
        <button type="button" className="btn" disabled={pending || waiting} onClick={() => void send()}>
          {t("practiceSendThis")}
        </button>
      )}
      {error ? (
        <p className="text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </article>
  );
}

export function PracticeSession({
  code,
  title,
  tutorialUrl,
  clipUrl,
  sheetUrl,
  sheetKind,
  sheetSync,
  clips: initialClips,
}: {
  code: string;
  title: string;
  tutorialUrl: string | null;
  clipUrl: string | null;
  sheetUrl: string | null;
  sheetKind: "pdf" | "image" | "musicxml" | "file";
  sheetSync: SheetSyncJson | null;
  clips: StudentPitchClip[];
}) {
  const t = useTranslations("student");
  const [clips, setClips] = useState(initialClips);
  const [recorderKey, setRecorderKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<"sign" | "upload" | "save">("sign");
  const [error, setError] = useState<string | null>(null);
  const referenceUrl = tutorialUrl ?? clipUrl;
  const synced =
    sheetSync?.confidence === "ok" &&
    sheetSync.points.length > 0 &&
    sheetKind === "musicxml" &&
    sheetUrl &&
    tutorialUrl
      ? { tutorialUrl, sheetUrl, points: sheetSync.points }
      : null;

  const refreshOpen = useCallback(async () => {
    const openIds = clips.filter((clip) => isOpenAnalyze(clip.job?.status)).map((clip) => clip.id);
    if (openIds.length === 0) return;
    const rows = await Promise.all(
      openIds.map(async (id) => {
        const res = await fetchWithServiceWait(`/api/student/takes/${id}/pitch`, {}, API_WAIT_MS);
        if (!res.ok) return null;
        return (await res.json()) as StudentPitchClip;
      }),
    );
    setClips((prev) =>
      prev.map((clip) => {
        const next = rows.find((row) => row?.id === clip.id);
        return next ?? clip;
      }),
    );
  }, [clips]);

  useEffect(() => {
    const open = clips.some((clip) => isOpenAnalyze(clip.job?.status));
    if (!open) return;
    const timer = window.setInterval(() => {
      void refreshOpen();
    }, 4000);
    return () => window.clearInterval(timer);
  }, [clips, refreshOpen]);

  async function saveFile(file: File) {
    setError(null);
    if (file.size > MAX_VIDEO_BYTES) {
      setError(t("tooBig"));
      return;
    }
    try {
      const duration = await mediaDuration(file);
      if (Number.isFinite(duration) && duration > MAX_VIDEO_SECONDS) {
        setError(t("tooBig"));
        return;
      }
    } catch {
      // size already checked
    }
    setBusy(true);
    setPhase("sign");
    try {
      setPhase("upload");
      const submissionId = await submitPractice(code, file);
      setPhase("save");
      const res = await fetchWithServiceWait(`/api/student/takes/${submissionId}/pitch`, {}, API_WAIT_MS);
      const clip = res.ok ? ((await res.json()) as StudentPitchClip) : null;
      if (clip) setClips((prev) => [clip, ...prev.filter((row) => row.id !== clip.id)]);
      setRecorderKey((key) => key + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("practiceFailed"));
    } finally {
      setBusy(false);
    }
  }

  const sending =
    phase === "sign" ? t("sending") : phase === "upload" ? t("sendingUpload") : t("sendingSave");

  return (
    <div className="practice-session">
      <header className="practice-session-bar">
        <Link href={`/student/work/${code}`} className="btn btn-quiet">
          {t("exitPractice")}
        </Link>
        <div className="min-w-0">
          <p className="field-label">{t("practiceSessionTitle")}</p>
          <h1 className="font-display truncate">{title}</h1>
        </div>
      </header>
      <p className="practice-session-help">{t("practiceSessionHelp")}</p>
      <div className="practice-session-stage">
        {synced ? (
          <SyncedTutorial
            tiled
            tutorialUrl={synced.tutorialUrl}
            sheetUrl={synced.sheetUrl}
            points={synced.points}
            videoLabel={t("reference")}
            sheetLabel={t("sheet")}
            openSheet={t("openSheet")}
          />
        ) : (
          <>
            <section className="practice-session-pane">
              {referenceUrl ? (
                <LoopSpeedPlayer src={referenceUrl} label={tutorialUrl ? t("reference") : t("clip")} />
              ) : (
                <p className="text-sm text-ink-soft">{t("practiceNoTutorial")}</p>
              )}
            </section>
            <section className="practice-session-pane">
              {sheetUrl && sheetKind === "musicxml" ? (
                <>
                  <p className="mb-2 text-sm">{t("sheet")}</p>
                  <MusicXmlSheet sheetUrl={sheetUrl} openSheet={t("openSheet")} />
                </>
              ) : sheetUrl && sheetKind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={sheetUrl} alt="" className="w-full rounded-2xl bg-white" />
              ) : sheetUrl && sheetKind === "pdf" ? (
                <object data={sheetUrl} type="application/pdf" className="practice-session-pdf">
                  <a href={sheetUrl} target="_blank" rel="noreferrer" className="text-sm underline">
                    {t("openSheet")}
                  </a>
                </object>
              ) : sheetUrl ? (
                <a href={sheetUrl} target="_blank" rel="noreferrer" className="text-sm underline">
                  {t("openSheet")}
                </a>
              ) : (
                <p className="text-sm text-ink-soft">{t("practiceNoSheet")}</p>
              )}
            </section>
          </>
        )}
        <section className="practice-session-pane practice-session-cam">
          <TakeRecorder
            key={recorderKey}
            kind="practice"
            maxSeconds={MAX_VIDEO_SECONDS}
            onTake={(file) => {
              if (file) void saveFile(file);
            }}
            icons
          />
          <label className="practice-session-file">
            <span className="field-label">{t("practiceOrFile")}</span>
            <input
              type="file"
              accept="video/*"
              disabled={busy}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void saveFile(file);
              }}
            />
          </label>
          {busy ? (
            <p role="status" className="text-sm">
              {sending}
            </p>
          ) : null}
          {error ? (
            <p role="alert" className="text-sm">
              {error}
            </p>
          ) : null}
          <div className="practice-clip-list">
            {clips.map((clip) => (
              <PracticeClipCard
                key={clip.id}
                clip={clip}
                onSent={(next) => setClips((prev) => prev.map((row) => (row.id === next.id ? next : row)))}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
