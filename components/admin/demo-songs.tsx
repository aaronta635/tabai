"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createDemoPiece, saveDemoPiece } from "@/app/admin/actions";
import { MAX_SHEET_BYTES, MAX_VIDEO_BYTES } from "@/lib/constants";

type Labels = {
  title: string;
  help: string;
  name: string;
  sheet: string;
  video: string;
  save: string;
  replace: string;
  ready: string;
  training: string;
  needSheet: string;
  tooBig: string;
  failed: string;
};

type Song = {
  id: string;
  title: string;
  code: string;
  ready: boolean;
};

async function uploadAsset(pieceId: string, kind: "sheet" | "tutorial", file: File) {
  const sign = await fetch(`/api/admin/pieces/${pieceId}/upload-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, size: file.size, filename: file.name }),
  });
  const signed = (await sign.json()) as { error?: string; signedUrl?: string; mediaId?: string; contentType?: string };
  if (!sign.ok || !signed.signedUrl || !signed.mediaId) throw new Error(signed.error ?? "sign failed");
  const put = await fetch(signed.signedUrl, {
    method: "PUT",
    headers: { "Content-Type": signed.contentType || file.type || "application/octet-stream" },
    body: file,
  });
  if (!put.ok) throw new Error("upload failed");
  return signed.mediaId;
}

export function DemoSongs({ labels, songs }: { labels: Labels; songs: Song[] }) {
  return (
    <section id="songs" className="studio-panel space-y-4">
      <div>
        <h2 className="font-display">{labels.title}</h2>
        <p className="page-meta">{labels.help}</p>
      </div>
      <SongForm labels={labels} />
      <ul className="space-y-3">
        {songs.map((song) => (
          <li key={song.id} className="rounded-xl border border-ink/10 px-3 py-3">
            <p className="font-medium">{song.title}</p>
            <p className="page-meta">
              {song.code} · {song.ready ? labels.ready : labels.training}
            </p>
            <SongForm labels={labels} pieceId={song.id} defaultTitle={song.title} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function SongForm({
  labels,
  pieceId,
  defaultTitle,
}: {
  labels: Labels;
  pieceId?: string;
  defaultTitle?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    const title = String(data.get("title") ?? "").trim();
    const sheet = data.get("sheet");
    const video = data.get("video");
    const sheetFile = sheet instanceof File && sheet.size > 0 ? sheet : null;
    const videoFile = video instanceof File && video.size > 0 ? video : null;
    if (!pieceId && !title) {
      setError(labels.needSheet);
      return;
    }
    if (!pieceId && !sheetFile) {
      setError(labels.needSheet);
      return;
    }
    if (sheetFile && sheetFile.size > MAX_SHEET_BYTES) {
      setError(labels.tooBig);
      return;
    }
    if (videoFile && videoFile.size > MAX_VIDEO_BYTES) {
      setError(labels.tooBig);
      return;
    }

    setBusy(true);
    try {
      const created = pieceId ? { id: pieceId } : await createDemoPiece(title);
      if ("error" in created) {
        setError(labels.needSheet);
        return;
      }
      const sheetMediaId = sheetFile ? await uploadAsset(created.id, "sheet", sheetFile) : undefined;
      const tutorialMediaId = videoFile ? await uploadAsset(created.id, "tutorial", videoFile) : undefined;
      await saveDemoPiece({
        pieceId: created.id,
        title: pieceId ? title : undefined,
        sheetMediaId,
        tutorialMediaId,
      });
      form.reset();
      router.refresh();
    } catch {
      setError(labels.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 space-y-2">
      <label className="block">
        <span className="field-label">{labels.name}</span>
        <input name="title" defaultValue={defaultTitle} className="field mt-1.5" />
      </label>
      <label className="block">
        <span className="field-label">{labels.sheet}</span>
        <input name="sheet" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.musicxml,.xml" className="field mt-1.5" />
      </label>
      <label className="block">
        <span className="field-label">{labels.video}</span>
        <input name="video" type="file" accept=".mp4,.webm,.mov,.m4v,video/*" className="field mt-1.5" />
      </label>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <button className="btn" type="submit" disabled={busy}>
        {busy ? "…" : pieceId ? labels.replace : labels.save}
      </button>
    </form>
  );
}
