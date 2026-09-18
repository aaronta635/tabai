"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { FilePicker } from "@/components/file-picker";

type Props = {
  code: string;
  needsProfile: boolean;
};

type JsonBag = {
  error?: string;
  fields?: { name?: boolean; contactHandle?: boolean };
  signedUrl?: string;
  mediaId?: string;
  studentToken?: string;
  page?: string;
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

export function StudentUpload({ code, needsProfile }: Props) {
  const t = useTranslations("student");
  const [ageBand, setAgeBand] = useState<"under18" | "adult">("adult");
  const [contactType, setContactType] = useState<"zalo" | "messenger">("zalo");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<{ name?: string; contactHandle?: string }>({});
  const [recordSupported, setRecordSupported] = useState(false);
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [video, setVideo] = useState<File | null>(null);

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
        setVideo(new File([blob], "take.webm", { type: blob.type }));
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
    setFieldError({});
    const form = event.currentTarget;
    const data = new FormData(form);
    const picked = video;
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
        const nameRaw = String(data.get("name") ?? "");
        const contactRaw = String(data.get("contactHandle") ?? "");
        if (!nameRaw.trim() || !contactRaw.trim()) {
          const next = {
            name: !nameRaw.trim() ? t("nameRequired") : undefined,
            contactHandle: !contactRaw.trim() ? t("contactRequired") : undefined,
          };
          setFieldError(next);
          setError([next.name, next.contactHandle].filter(Boolean).join(" "));
          setBusy(false);
          return;
        }
        const register = await fetch(`/api/l/${code}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: nameRaw.trim(),
            ageBand,
            contactType,
            contactHandle: contactRaw.trim(),
            publicOk: ageBand === "adult" && data.get("publicOk") === "on",
            consent: true,
          }),
        });
        const registerJson = await readJson(register);
        if (!register.ok) {
          setFieldError({
            name: registerJson.fields?.name ? t("nameRequired") : undefined,
            contactHandle: registerJson.fields?.contactHandle ? t("contactRequired") : undefined,
          });
          throw new Error(
            [registerJson.fields?.name ? t("nameRequired") : null, registerJson.fields?.contactHandle ? t("contactRequired") : null]
              .filter(Boolean)
              .join(" ") || registerJson.error || "register failed",
          );
        }
      }

      const sign = await fetch(`/api/l/${code}/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          size: picked.size,
          contentType: picked.type || "video/mp4",
        }),
      });
      const signed = await readJson(sign);
      if (!sign.ok) throw new Error(signed.error ?? "sign failed");
      if (typeof signed.signedUrl !== "string" || typeof signed.mediaId !== "string") {
        throw new Error("sign failed");
      }

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
      const finished = await readJson(complete);
      if (!complete.ok) throw new Error(finished.error ?? "complete failed");
      if (typeof finished.studentToken === "string") {
        localStorage.setItem("student_token", finished.studentToken);
      }
      if (typeof finished.page === "string") {
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
    return <p className="rounded-2xl bg-beat px-5 py-6 text-lg text-white">{t("sent")}</p>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {needsProfile ? (
        <div className="space-y-4 rounded-2xl bg-white/70 p-4">
          <label className="block text-sm">
            {t("name")}
            <input required name="name" className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-3 py-3" />
            {fieldError.name ? <p className="mt-1 text-sm text-danger">{fieldError.name}</p> : null}
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
            {fieldError.contactHandle ? <p className="mt-1 text-sm text-danger">{fieldError.contactHandle}</p> : null}
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

      <div>
        <p className="mb-2 text-sm font-medium">{t("upload")}</p>
        <FilePicker
          accept="video/*"
          capture="environment"
          file={video}
          onFile={setVideo}
          buttonLabel={t("chooseFile")}
          changeLabel={t("changeFile")}
          size="lg"
        />
      </div>

      {recordSupported ? (
        <button
          type="button"
          onClick={recording ? stopRecord : startRecord}
          className="w-full rounded-2xl border border-ink/20 py-3"
        >
          {recording ? "Stop" : t("record")}
        </button>
      ) : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-2xl bg-beat px-4 py-4 text-lg font-medium text-white disabled:opacity-60"
      >
        {busy ? "…" : t("submit")}
      </button>
    </form>
  );
}
