"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

type Props = {
  code: string;
  needsProfile: boolean;
};

export function StudentUpload({ code, needsProfile }: Props) {
  const t = useTranslations("student");
  const fileRef = useRef<HTMLInputElement>(null);
  const [ageBand, setAgeBand] = useState<"under18" | "adult">("adult");
  const [contactType, setContactType] = useState<"zalo" | "messenger">("zalo");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordSupported, setRecordSupported] = useState(false);
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recorded, setRecorded] = useState<File | null>(null);

  useEffect(() => {
    setRecordSupported(typeof MediaRecorder !== "undefined");
  }, []);

  async function startRecord() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" });
        setRecorded(new File([blob], "take.webm", { type: blob.type }));
        setRecording(false);
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setRecordSupported(false);
    }
  }

  function stopRecord() {
    recorderRef.current?.stop();
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    const picked = fileRef.current?.files?.[0] ?? recorded;
    if (!picked) {
      setError(t("needFile"));
      return;
    }
    if (picked.size > 60 * 1024 * 1024) {
      setError(t("tooBig"));
      return;
    }

    setBusy(true);
    try {
      if (needsProfile) {
        const register = await fetch(`/api/l/${code}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.get("name"),
            ageBand,
            contactType,
            contactHandle: data.get("contactHandle"),
            publicOk: ageBand === "adult" && data.get("publicOk") === "on",
            consent: true,
          }),
        });
        const registerJson = await register.json();
        if (!register.ok) throw new Error(registerJson.error ?? "register failed");
      }

      const sign = await fetch(`/api/l/${code}/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          size: picked.size,
          contentType: picked.type || "video/mp4",
        }),
      });
      const signed = await sign.json();
      if (!sign.ok) throw new Error(signed.error ?? "sign failed");

      const put = await fetch(signed.signedUrl, {
        method: "PUT",
        headers: { "Content-Type": picked.type || "video/mp4" },
        body: picked,
      });
      if (!put.ok) throw new Error("upload failed");

      const complete = await fetch(`/api/l/${code}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId: signed.mediaId }),
      });
      const finished = await complete.json();
      if (!complete.ok) throw new Error(finished.error ?? "complete failed");
      if (finished.studentToken) {
        localStorage.setItem("student_token", finished.studentToken);
      }
      if (finished.page) {
        window.location.href = finished.page;
        return;
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "error");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return <p className="rounded-2xl bg-forest px-5 py-6 text-lg text-white">{t("sent")}</p>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {needsProfile ? (
        <div className="space-y-4 rounded-2xl bg-white/70 p-4">
          <label className="block text-sm">
            {t("name")}
            <input required name="name" className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-3 py-3" />
          </label>
          <fieldset className="text-sm">
            <legend>{t("age")}</legend>
            <div className="mt-2 flex gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="ageBand"
                  checked={ageBand === "adult"}
                  onChange={() => setAgeBand("adult")}
                />
                {t("adult")}
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="ageBand"
                  checked={ageBand === "under18"}
                  onChange={() => setAgeBand("under18")}
                />
                {t("under18")}
              </label>
            </div>
          </fieldset>
          <fieldset className="text-sm">
            <legend>{t("contact")}</legend>
            <div className="mt-2 flex gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={contactType === "zalo"}
                  onChange={() => setContactType("zalo")}
                />
                Zalo
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={contactType === "messenger"}
                  onChange={() => setContactType("messenger")}
                />
                Messenger
              </label>
            </div>
            <input
              required
              name="contactHandle"
              placeholder={contactType === "zalo" ? t("zalo") : t("messenger")}
              className="mt-2 w-full rounded-xl border border-ink/15 bg-white px-3 py-3"
            />
          </fieldset>
          <p className="text-sm leading-relaxed text-ink-soft">{t("consent")}</p>
          <p className="text-sm text-ink-soft">{t("under18Line")}</p>
          {ageBand === "adult" ? (
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" name="publicOk" defaultChecked className="mt-1" />
              {t("publicOk")}
            </label>
          ) : (
            <p className="text-sm text-ink-soft">{t("publicForcedOff")}</p>
          )}
        </div>
      ) : null}

      <label className="block">
        <span className="mb-2 block text-sm font-medium">{t("upload")}</span>
        <input
          ref={fileRef}
          type="file"
          accept="video/*"
          capture="environment"
          className="block w-full rounded-2xl border border-dashed border-ink/25 bg-white px-4 py-8"
        />
      </label>

      {recordSupported ? (
        <button
          type="button"
          onClick={recording ? stopRecord : startRecord}
          className="w-full rounded-2xl border border-ink/20 py-3"
        >
          {recording ? "Stop" : t("record")}
        </button>
      ) : null}

      {recorded ? <p className="text-sm text-forest">Recorded {Math.round(recorded.size / 1024)} KB</p> : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-2xl bg-forest px-4 py-4 text-lg font-medium text-white disabled:opacity-60"
      >
        {busy ? "…" : t("submit")}
      </button>
    </form>
  );
}
