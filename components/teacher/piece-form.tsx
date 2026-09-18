"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { completePieceAssets, createPieceRecord } from "@/app/teacher/actions";
import { FilePicker } from "@/components/file-picker";
import { MAX_SHEET_BYTES, MAX_VIDEO_BYTES } from "@/lib/constants";

type Props = {
  pieceId?: string;
  catalogSlug?: string;
  defaultTitle?: string;
  defaultNote?: string;
  showMeta?: boolean;
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

async function uploadAsset(pieceId: string, kind: "sheet" | "tutorial", file: File) {
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
  catalogSlug,
  defaultTitle,
  defaultNote,
  showMeta = true,
}: Props) {
  const t = useTranslations("teacher");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheetFile, setSheetFile] = useState<File | null>(null);
  const [tutorialFile, setTutorialFile] = useState<File | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    const titleRaw = String(data.get("title") ?? defaultTitle ?? "");
    const titleTrim = titleRaw.trim();

    if (!pieceId && !titleTrim) {
      // #region agent log
      fetch("http://127.0.0.1:7777/ingest/72b4f31c-651a-4621-bf28-9e2c74943a88", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "32cab8" },
        body: JSON.stringify({
          sessionId: "32cab8",
          runId: "teacher-verify",
          hypothesisId: "H-E06",
          location: "components/teacher/piece-form.tsx:onSubmit",
          message: "client rejected empty title",
          data: { rawLen: titleRaw.length, trimmedLen: titleTrim.length },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
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
    if (!sheetFile && !tutorialFile) {
      setError(t("needFile"));
      return;
    }

    setBusy(true);
    try {
      let id = pieceId;
      let code: string | undefined;
      if (!id) {
        const created = await createPieceRecord({
          title: titleRaw,
          note: String(data.get("note") ?? defaultNote ?? ""),
          catalogSlug,
        });
        if ("error" in created) {
          setError(t("titleRequired"));
          return;
        }
        id = created.id;
        code = created.code;
      }

      let sheetMediaId: string | undefined;
      let tutorialMediaId: string | undefined;
      if (sheetFile) {
        sheetMediaId = await uploadAsset(id, "sheet", sheetFile);
        const done = await completePieceAssets({ pieceId: id, sheetMediaId });
        code = done.code;
      }
      if (tutorialFile) {
        tutorialMediaId = await uploadAsset(id, "tutorial", tutorialFile);
        const done = await completePieceAssets({ pieceId: id, tutorialMediaId });
        code = done.code;
      }

      form.reset();
      setSheetFile(null);
      setTutorialFile(null);
      if (code && !pieceId) {
        router.push(`/teacher/pieces?created=${code}`);
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
    <form onSubmit={onSubmit} className="lms-card space-y-3 p-4">
      {showMeta ? (
        <>
          <input
            required
            name="title"
            defaultValue={defaultTitle}
            placeholder={t("title")}
            className="w-full rounded-xl border border-ink/10 bg-white px-3 py-3"
          />
          <textarea
            name="note"
            defaultValue={defaultNote}
            placeholder={t("note")}
            rows={2}
            className="w-full rounded-xl border border-ink/10 bg-white px-3 py-3"
          />
        </>
      ) : null}
      <div className="text-sm">
        <p className="mb-1 font-medium">{t("sheetLabel")}</p>
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
        <p className="mb-1 font-medium">{t("tutorialLabel")}</p>
        <FilePicker
          accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.m4v"
          file={tutorialFile}
          onFile={setTutorialFile}
          buttonLabel={t("chooseTutorial")}
          changeLabel={t("changeFile")}
          hint={t("tutorialHint")}
        />
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-beat px-4 py-3 text-white disabled:opacity-60"
      >
        {busy ? "…" : pieceId ? t("attachAssets") : t("createPiece")}
      </button>
    </form>
  );
}
