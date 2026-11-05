"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { completePieceAssets, createPieceRecord, updatePieceAssignment } from "@/app/teacher/actions";
import { FilePicker } from "@/components/file-picker";
import { MusicXmlSheet } from "@/components/student/musicxml-sheet";
import { PieceSelect } from "@/components/teacher/piece-select";
import { MAX_CLIP_BYTES, MAX_CLIP_SECONDS, MAX_SHEET_BYTES, MAX_VIDEO_BYTES } from "@/lib/constants";
import { requiredText } from "@/lib/forms";
import { SONG_MODES, SONG_TONICS, TUNINGS, parseSongKey, parseTuning, type SetupLocale, type SongMode } from "@/lib/piece-setup";

type Props = {
  pieceId?: string;
  partId?: string;
  defaultTitle?: string;
  defaultNote?: string;
  defaultTips?: string;
  defaultSongKey?: string;
  defaultTuning?: string;
  showMeta?: boolean;
  savedTutorialUrl?: string | null;
  savedSheetUrl?: string | null;
  savedSheetKind?: "pdf" | "image" | "musicxml" | "file";
  onSaved?: () => void;
  hasSheet?: boolean;
  hasTutorial?: boolean;
  hasClip?: boolean;
};

type SignJson = {
  error?: string;
  signedUrl?: string;
  mediaId?: string;
  contentType?: string;
};

const STEPS = ["title", "key", "tuning", "files"] as const;
type Step = (typeof STEPS)[number];

async function readJson(res: Response): Promise<SignJson> {
  const text = await res.text();
  if (!text) return { error: res.statusText || "empty response" };
  try {
    return JSON.parse(text) as SignJson;
  } catch {
    return { error: text };
  }
}

async function mediaDuration(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const duration = await new Promise<number>((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => resolve(video.duration || 0);
      video.onerror = () => reject(new Error("duration"));
      video.src = url;
    });
    return duration;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function uploadAsset(pieceId: string, kind: "sheet" | "tutorial" | "clip", file: File) {
  const sign = await fetch(`/api/teacher/pieces/${pieceId}/upload-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kind,
      size: file.size,
      filename: file.name,
      contentType: file.type,
    }),
  });
  const signed = await readJson(sign);
  if (!sign.ok) throw new Error(signed.error ?? "sign failed");
  if (typeof signed.signedUrl !== "string" || typeof signed.mediaId !== "string") {
    throw new Error("sign failed");
  }
  const put = await fetch(signed.signedUrl, {
    method: "PUT",
    headers: { "Content-Type": signed.contentType || file.type || "application/octet-stream" },
    body: file,
  });
  if (!put.ok) throw new Error("upload failed");
  return signed.mediaId;
}

export function PieceForm({
  pieceId,
  partId,
  defaultTitle = "",
  defaultNote = "",
  defaultTips = "",
  defaultSongKey = "",
  defaultTuning = "",
  showMeta = true,
  hasSheet = false,
  hasTutorial = false,
  hasClip = false,
  savedTutorialUrl = null,
  savedSheetUrl = null,
  savedSheetKind = "file",
  onSaved,
}: Props) {
  const t = useTranslations("teacher");
  const locale: SetupLocale = useLocale() === "en" ? "en" : "vi";
  const router = useRouter();
  const steps: Step[] = showMeta ? [...STEPS] : ["files"];
  const [stepIndex, setStepIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(defaultTitle);
  const [note] = useState(defaultNote);
  const [tips] = useState(defaultTips);
  const [songKey, setSongKey] = useState(defaultSongKey);
  const [tuning, setTuning] = useState(defaultTuning);
  const [sheetFile, setSheetFile] = useState<File | null>(null);
  const [tutorialFile, setTutorialFile] = useState<File | null>(null);
  const [clipFile, setClipFile] = useState<File | null>(null);

  const step = steps[stepIndex] ?? "files";
  const stepNames: Record<Step, string> = {
    title: t("stepTitle"),
    key: t("stepKey"),
    tuning: t("stepTuning"),
    files: t("stepFiles"),
  };
  const [tutorialPreview, setTutorialPreview] = useState<string | null>(null);
  const [sheetPreview, setSheetPreview] = useState<string | null>(null);
  useEffect(() => {
    if (!tutorialFile) {
      setTutorialPreview(null);
      return;
    }
    const url = URL.createObjectURL(tutorialFile);
    setTutorialPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [tutorialFile]);
  useEffect(() => {
    if (!sheetFile) {
      setSheetPreview(null);
      return;
    }
    const url = URL.createObjectURL(sheetFile);
    setSheetPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [sheetFile]);
  const parsedKey = parseSongKey(songKey);
  const tonic = parsedKey?.split(" ")[0] ?? "";
  const mode = (parsedKey?.split(" ")[1] ?? "") as SongMode | "";

  function chooseTonic(next: string) {
    setSongKey(`${next} ${mode || "major"}`);
    setError(null);
  }

  function chooseMode(next: SongMode) {
    if (!tonic) return;
    setSongKey(`${tonic} ${next}`);
    setError(null);
  }

  function goNext() {
    if (step === "title" && !requiredText(title)) {
      setError(t("titleRequired"));
      return;
    }
    if (step === "key" && !parseSongKey(songKey)) {
      setError(t("pickKey"));
      return;
    }
    if (step === "tuning" && !parseTuning(tuning)) {
      setError(t("pickTuning"));
      return;
    }
    setError(null);
    setStepIndex((index) => Math.min(index + 1, steps.length - 1));
  }

  async function savePiece() {
    setError(null);
    const titleTrim = requiredText(title);

    if (!pieceId && !titleTrim) {
      setError(t("titleRequired"));
      setStepIndex(0);
      return;
    }

    if (sheetFile && sheetFile.size > MAX_SHEET_BYTES) {
      setError(t("tooBigSheet"));
      return;
    }
    if (tutorialFile && tutorialFile.size > MAX_VIDEO_BYTES) {
      setError(t("tooBig"));
      return;
    }
    if (clipFile && clipFile.size > MAX_CLIP_BYTES) {
      setError(t("tooBigClip"));
      return;
    }
    if (clipFile) {
      try {
        const duration = await mediaDuration(clipFile);
        if (duration > MAX_CLIP_SECONDS) {
          setError(t("tooBigClip"));
          return;
        }
      } catch {
        setError(t("tooBigClip"));
        return;
      }
    }

    setBusy(true);
    try {
      let id = pieceId;
      const setup = {
        songKey: parseSongKey(songKey),
        tuning: parseTuning(tuning),
      };
      if (!id) {
        const created = await createPieceRecord({
          title,
          note,
          partId,
          description: note,
          tips,
          ...setup,
        });
        if ("error" in created) {
          setError(created.error === "title_required" ? t("titleRequired") : created.error === "tuning" ? t("pickTuning") : t("pickKey"));
          return;
        }
        id = created.id;
      } else {
        const updated = await updatePieceAssignment({
          pieceId: id,
          title: showMeta ? title : undefined,
          note: showMeta ? note : undefined,
          tips: showMeta ? tips : undefined,
          ...(showMeta ? setup : {}),
        });
        if (updated && "error" in updated) {
          setError(updated.error === "title_required" ? t("titleRequired") : updated.error === "tuning" ? t("pickTuning") : t("pickKey"));
          return;
        }
      }

      let sheetMediaId: string | undefined;
      let tutorialMediaId: string | undefined;
      let clipMediaId: string | undefined;
      if (sheetFile) sheetMediaId = await uploadAsset(id, "sheet", sheetFile);
      if (tutorialFile) tutorialMediaId = await uploadAsset(id, "tutorial", tutorialFile);
      if (clipFile) clipMediaId = await uploadAsset(id, "clip", clipFile);
      if (sheetMediaId || tutorialMediaId || clipMediaId) {
        await completePieceAssets({ pieceId: id, sheetMediaId, tutorialMediaId, clipMediaId });
      }

      setSheetFile(null);
      setTutorialFile(null);
      setClipFile(null);
      if (!pieceId && id) {
        onSaved?.();
        router.push(`/teacher/curriculum/${id}`);
        router.refresh();
        return;
      }
      onSaved?.();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "error");
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step !== "files") goNext();
  }

  return (
    <form onSubmit={onSubmit} className="piece-setup space-y-4">
      <ol className="piece-steps">
        {steps.map((id, index) => (
          <li key={id}>
            <button
              type="button"
              className="piece-step"
              aria-current={index === stepIndex ? "step" : undefined}
              disabled={index > stepIndex}
              onClick={() => {
                setError(null);
                setStepIndex(index);
              }}
            >
              <span className="tabular">{index + 1}</span>
              {stepNames[id]}
            </button>
          </li>
        ))}
      </ol>

      {step === "title" ? (
        <label className="block">
          <span className="piece-question">{t("title")}</span>
          <input required value={title} onChange={(event) => setTitle(event.target.value)} className="field" />
        </label>
      ) : null}

      {step === "key" ? (
        <div className="space-y-4">
          <p className="text-sm text-ink-soft">{t("stepKeyHelp")}</p>
          <PieceSelect
            label={t("stepKey")}
            value={tonic}
            placeholder={t("pickKey")}
            options={SONG_TONICS.map((name) => ({ id: name, label: name }))}
            onChange={chooseTonic}
          />
          <PieceSelect
            label={t("stepMode")}
            value={mode}
            placeholder={t("stepMode")}
            options={SONG_MODES.map((name) => ({
              id: name,
              label: name === "major" ? t("keyMajor") : t("keyMinor"),
            }))}
            onChange={(next) => chooseMode(next as SongMode)}
          />
        </div>
      ) : null}

      {step === "tuning" ? (
        <div className="space-y-3">
          <p className="text-sm text-ink-soft">{t("stepTuningHelp")}</p>
          <PieceSelect
            label={t("stepTuning")}
            value={tuning}
            placeholder={t("pickTuning")}
            options={TUNINGS.map((row) => ({
              id: row.id,
              label: row.name[locale],
              detail: row.pitches.join(" "),
            }))}
            onChange={(id) => {
              setTuning(id);
              setError(null);
            }}
          />
        </div>
      ) : null}

      {step === "files" ? (
        <div className="piece-files">
          <div className="space-y-3 text-sm">
            <div>
              <p className="piece-question">{t("sheetLabel")}</p>
              <FilePicker
                accept=".pdf,.png,.jpg,.jpeg,.webp,.musicxml,.xml,application/pdf,image/*"
                file={sheetFile}
                onFile={setSheetFile}
                buttonLabel={hasSheet ? t("changeFile") : t("chooseSheet")}
                changeLabel={t("changeFile")}
                hint={hasSheet ? t("replaceHint") : t("sheetHint")}
              />
            </div>
            <div>
              <p className="piece-question">{t("tutorialLabel")}</p>
              <FilePicker
                accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.m4v"
                file={tutorialFile}
                onFile={setTutorialFile}
                buttonLabel={hasTutorial ? t("changeFile") : t("chooseTutorial")}
                changeLabel={t("changeFile")}
                hint={hasTutorial ? t("replaceHint") : t("tutorialHint")}
              />
            </div>
            <div>
              <p className="piece-question">{t("clipLabel")}</p>
              <FilePicker
                accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.m4v"
                file={clipFile}
                onFile={setClipFile}
                buttonLabel={hasClip ? t("changeClip") : t("chooseClip")}
                changeLabel={t("changeFile")}
                hint={t("clipHint")}
              />
            </div>
          </div>
          <aside className="piece-preview">
            <p className="piece-question">{t("tutorialLabel")}</p>
            {tutorialPreview || savedTutorialUrl ? (
              <video src={tutorialPreview ?? savedTutorialUrl ?? undefined} controls playsInline className="piece-preview-video" />
            ) : (
              <p className="text-sm text-ink-soft">{t("previewEmpty")}</p>
            )}
            {sheetPreview && /\.(xml|musicxml)$/i.test(sheetFile?.name ?? "") ? (
              <MusicXmlSheet sheetUrl={sheetPreview} openSheet={t("hasSheet")} />
            ) : null}
            {!sheetFile && savedSheetUrl && savedSheetKind === "musicxml" ? (
              <MusicXmlSheet sheetUrl={savedSheetUrl} openSheet={t("hasSheet")} />
            ) : null}
          </aside>
        </div>
      ) : null}

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        {stepIndex > 0 ? (
          <button
            type="button"
            className="btn btn-quiet"
            onClick={() => {
              setError(null);
              setStepIndex((index) => index - 1);
            }}
          >
            {t("stepBack")}
          </button>
        ) : null}
        {step === "files" ? (
          <button
            key="save-piece"
            type="button"
            disabled={busy}
            className="btn disabled:opacity-60"
            onClick={() => void savePiece()}
          >
            {busy ? "…" : pieceId ? t("attachAssets") : t("createPiece")}
          </button>
        ) : (
          <button key="next-step" type="button" className="btn" onClick={goNext}>
            {t("stepNext")}
          </button>
        )}
      </div>
    </form>
  );
}
