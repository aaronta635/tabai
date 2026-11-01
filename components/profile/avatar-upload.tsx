"use client";

import { useState } from "react";
import { saveAvatar } from "@/app/onboarding/actions";
import { MAX_AVATAR_BYTES } from "@/lib/constants";
import { AvatarMark } from "@/components/profile/avatar-mark";

export function AvatarUpload({
  role,
  name,
  current,
  label,
  help,
  tooBig,
  failed,
}: {
  role: "teacher" | "student";
  name: string;
  current?: string | null;
  label: string;
  help: string;
  tooBig: string;
  failed: string;
}) {
  const [preview, setPreview] = useState(current ?? null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(file: File) {
    setError(null);
    if (file.size > MAX_AVATAR_BYTES) {
      setError(tooBig);
      return;
    }
    setBusy(true);
    try {
      const sign = await fetch("/api/account/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, size: file.size, filename: file.name }),
      });
      const signed = (await sign.json()) as { error?: string; signedUrl?: string; path?: string; contentType?: string };
      if (!sign.ok || !signed.signedUrl || !signed.path) throw new Error(signed.error ?? "sign");
      const put = await fetch(signed.signedUrl, {
        method: "PUT",
        headers: { "Content-Type": signed.contentType || file.type || "application/octet-stream" },
        body: file,
      });
      if (!put.ok) throw new Error("upload");
      const saved = await saveAvatar(signed.path, role);
      if ("error" in saved) throw new Error(saved.error);
      setPreview(URL.createObjectURL(file));
    } catch {
      setError(failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="setup-photo">
      <AvatarMark name={name} src={preview} large />
      <label className="setup-block">
        <span className="setup-label">{label}</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="setup-field"
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void onFile(file);
          }}
        />
      </label>
      <p className="text-sm text-ink-soft">{help}</p>
      {error ? <p className="setup-error">{error}</p> : null}
    </div>
  );
}
