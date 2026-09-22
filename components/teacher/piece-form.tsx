"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { completePieceAssets, createPieceRecord, updatePieceAssignment } from "@/app/teacher/actions";
import { FilePicker } from "@/components/file-picker";
import { MAX_CLIP_BYTES, MAX_CLIP_SECONDS, MAX_SHEET_BYTES, MAX_VIDEO_BYTES } from "@/lib/constants";
import { requiredText } from "@/lib/forms";

type Props = {
  pieceId?: string;
  partId?: string;
  defaultTitle?: string;
  defaultNote?: string;
  defaultTips?: string;
  showMeta?: boolean;
  hasClip?: boolean;
};

type SignJson = {
  error?: string;
  signedUrl?: string;
  mediaId?: string;
  contentType?: string;
};

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
  defaultTitle,
  defaultNote,
  defaultTips,
  showMeta = true,
  hasClip = false,
}: Props) {
  const t = useTranslations("teacher");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheetFile, setSheetFile] = useState<File | null>(null);
  const [tutorialFile, setTutorialFile] = useState<File | null>(null);
  const [clipFile, setClipFile] = useState<File | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    const titleRaw = String(data.get("title") ?? defaultTitle ?? "");
    const titleTrim = requiredText(titleRaw);
    const description = String(data.get("note") ?? "");
    const tips = String(data.get("tips") ?? "");

    if (!pieceId && !titleTrim) {
      setError(t("titleRequired"));
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
      let code: string | undefined;
      if (!id) {
        const created = await createPieceRecord({
          title: titleRaw,
          note: description,
          partId,
          description,
          tips,
        });
        if ("error" in created) {
          setError(t("titleRequired"));
          return;
        }
        id = created.id;
        code = created.code;
      } else {
        const updated = await updatePieceAssignment({
          pieceId: id,
          title: showMeta ? titleRaw : undefined,
          note: showMeta ? description : undefined,
          tips: showMeta ? tips : undefined,
        });
        if (updated && "error" in updated) {
          setError(t("titleRequired"));
          return;
        }
        code = updated.code;
      }

      let sheetMediaId: string | undefined;
      let tutorialMediaId: string | undefined;
      let clipMediaId: string | undefined;
      if (sheetFile) sheetMediaId = await uploadAsset(id, "sheet", sheetFile);
      if (tutorialFile) tutorialMediaId = await uploadAsset(id, "tutorial", tutorialFile);
      if (clipFile) clipMediaId = await uploadAsset(id, "clip", clipFile);
      if (sheetMediaId || tutorialMediaId || clipMediaId) {
        const done = await completePieceAssets({ pieceId: id, sheetMediaId, tutorialMediaId, clipMediaId });
        code = done.code;
      }

      form.reset();
      setSheetFile(null);
      setTutorialFile(null);
      setClipFile(null);
      if (code && !pieceId) {
        router.push("/teacher/curriculum");
        router.refresh();
        return;
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {showMeta ? (
        <>
          <label className="block">
            <span className="field-label">{t("title")}</span>
            <input required name="title" defaultValue={defaultTitle} className="field mt-1.5" />
          </label>
          <label className="block">
            <span className="field-label">{t("description")}</span>
            <textarea name="note" defaultValue={defaultNote} rows={2} className="field mt-1.5" />
          </label>
          <label className="block">
            <span className="field-label">{t("tips")}</span>
            <textarea name="tips" defaultValue={defaultTips} rows={2} className="field mt-1.5" />
          </label>
        </>
      ) : null}
      <div className="text-sm">
        <p className="field-label mb-1.5">{t("sheetLabel")}</p>
        <FilePicker
          accept=".pdf,.png,.jpg,.jpeg,.webp,.musicxml,.xml,application/pdf,image/*"
          file={sheetFile}
          onFile={setSheetFile}
          buttonLabel={t("chooseSheet")}
          changeLabel={t("changeFile")}
          hint={t("sheetHint")}
        />
      </div>
      <div className="text-sm">
        <p className="field-label mb-1.5">{t("tutorialLabel")}</p>
        <FilePicker
          accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.m4v"
          file={tutorialFile}
          onFile={setTutorialFile}
          buttonLabel={t("chooseTutorial")}
          changeLabel={t("changeFile")}
          hint={t("tutorialHint")}
        />
      </div>
      <div className="text-sm">
        <p className="field-label mb-1.5">{t("clipLabel")}</p>
        <FilePicker
          accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.m4v"
          file={clipFile}
          onFile={setClipFile}
          buttonLabel={hasClip ? t("changeClip") : t("chooseClip")}
          changeLabel={t("changeFile")}
          hint={t("clipHint")}
        />
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <button type="submit" disabled={busy} className="btn w-full disabled:opacity-60">
        {busy ? "…" : pieceId ? t("attachAssets") : t("createPiece")}
      </button>
    </form>
  );
}
