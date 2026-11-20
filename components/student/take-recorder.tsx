"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ParaIcon } from "@/components/ui/para-icon";

type Phase = "idle" | "preview" | "recording" | "review" | "attached";
type Problem = "denied" | "noDevice" | "failed" | null;

type Props = {
  /** Used for the file name, for example `take.webm`. */
  kind: string;
  /** The recording stops by itself at this length. */
  maxSeconds: number;
  /** Called with the chosen take, or null when the student discards it. */
  onTake: (file: File | null) => void;
  /** True while the recorder owns the screen, so the parent can hide the file picker. */
  onActiveChange?: (active: boolean) => void;
  /** Show the studio icon set on the buttons. */
  icons?: boolean;
};

const VIDEO_TYPES = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"];
const AUDIO_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];

function pickMimeType(withVideo: boolean) {
  const candidates = withVideo ? VIDEO_TYPES : AUDIO_TYPES;
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function extensionFor(type: string) {
  return type.includes("mp4") ? "mp4" : "webm";
}

function clock(seconds: number) {
  const whole = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(whole / 60)).padStart(2, "0")}:${String(whole % 60).padStart(2, "0")}`;
}

function problemFrom(error: unknown): Problem {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return "denied";
  if (name === "NotFoundError" || name === "OverconstrainedError" || name === "DevicesNotFoundError") return "noDevice";
  return "failed";
}

function stopTracks(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

export function TakeRecorder({ kind, maxSeconds, onTake, onActiveChange, icons = false }: Props) {
  const t = useTranslations("student");
  const [supported, setSupported] = useState(true);
  const [phase, setPhase] = useState<Phase>("idle");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [problem, setProblem] = useState<Problem>(null);
  const [elapsed, setElapsed] = useState(0);
  const [take, setTake] = useState<{ url: string; seconds: number } | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const takeUrlRef = useRef<string | null>(null);
  const takeFileRef = useRef<File | null>(null);

  useEffect(() => {
    setSupported(typeof MediaRecorder !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia));
  }, []);

  useEffect(() => {
    onActiveChange?.(phase !== "idle");
  }, [phase, onActiveChange]);

  useEffect(() => {
    if (previewRef.current) previewRef.current.srcObject = stream;
  }, [stream, phase]);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const releaseStream = useCallback(() => {
    stopTracks(streamRef.current);
    streamRef.current = null;
    setStream(null);
  }, []);

  const dropTakeUrl = useCallback(() => {
    if (takeUrlRef.current) URL.revokeObjectURL(takeUrlRef.current);
    takeUrlRef.current = null;
    setTake(null);
  }, []);

  useEffect(
    () => () => {
      clearTimer();
      const recorder = recorderRef.current;
      if (recorder) {
        recorder.ondataavailable = null;
        recorder.onstop = null;
        if (recorder.state !== "inactive") recorder.stop();
      }
      stopTracks(streamRef.current);
      if (takeUrlRef.current) URL.revokeObjectURL(takeUrlRef.current);
    },
    [clearTimer],
  );

  /** Asks the browser for the camera and microphone. Only ever called from a click. */
  async function openStream(withCamera: boolean) {
    stopTracks(streamRef.current);
    streamRef.current = null;
    setProblem(null);
    const request = async (video: boolean) =>
      navigator.mediaDevices.getUserMedia({ video: video ? { facingMode: "user" } : false, audio: true });
    try {
      let next: MediaStream;
      let camera = withCamera;
      try {
        next = await request(withCamera);
      } catch (error) {
        // No camera on this device: record the sound only instead of giving up.
        if (!withCamera || problemFrom(error) !== "noDevice") throw error;
        next = await request(false);
        camera = false;
      }
      streamRef.current = next;
      setStream(next);
      setCameraOn(camera);
      setPhase("preview");
    } catch (error) {
      setStream(null);
      setProblem(problemFrom(error));
      setPhase("idle");
    }
  }

  function startRecording() {
    const active = streamRef.current;
    if (!active) return;
    const hasVideo = active.getVideoTracks().length > 0;
    const mimeType = pickMimeType(hasVideo);
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(active, mimeType ? { mimeType } : undefined);
    } catch {
      setProblem("failed");
      return;
    }
    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunksRef.current.push(event.data);
    };
    const startedAt = performance.now();
    recorder.onstop = () => {
      clearTimer();
      const seconds = (performance.now() - startedAt) / 1000;
      const type = recorder.mimeType || mimeType || (hasVideo ? "video/webm" : "audio/webm");
      const blob = new Blob(chunksRef.current, { type });
      releaseStream();
      const file = new File([blob], `${kind}.${extensionFor(type)}`, { type });
      takeFileRef.current = file;
      const url = URL.createObjectURL(blob);
      takeUrlRef.current = url;
      setTake({ url, seconds });
      setPhase("review");
    };
    recorderRef.current = recorder;
    recorder.start();
    setElapsed(0);
    setPhase("recording");
    timerRef.current = window.setInterval(() => {
      const seconds = (performance.now() - startedAt) / 1000;
      setElapsed(seconds);
      if (seconds >= maxSeconds) stopRecording();
    }, 250);
  }

  function stopRecording() {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }

  function cancel() {
    clearTimer();
    releaseStream();
    dropTakeUrl();
    takeFileRef.current = null;
    setProblem(null);
    onTake(null);
    setPhase("idle");
  }

  function recordAgain() {
    dropTakeUrl();
    takeFileRef.current = null;
    onTake(null);
    void openStream(cameraOn);
  }

  function useTake() {
    if (takeFileRef.current) onTake(takeFileRef.current);
    setPhase("attached");
  }

  const message =
    problem === "denied" ? t("recDenied") : problem === "noDevice" ? t("recNoDevice") : problem === "failed" ? t("recFailed") : null;
  const alert = message ? (
    <p className="take-recorder-note" role="alert">
      {message}
    </p>
  ) : null;

  if (phase === "idle") {
    return (
      <div className="take-recorder">
        <button type="button" className="btn btn-quiet" disabled={!supported} onClick={() => void openStream(true)}>
          {icons ? <ParaIcon name="video" /> : null}
          {t("recOpen")}
        </button>
        {!supported ? <p className="take-recorder-note">{t("recUnsupported")}</p> : null}
        {alert}
      </div>
    );
  }

  if (phase === "review" || phase === "attached") {
    const seconds = take?.seconds ?? 0;
    return (
      <div className="take-recorder" data-phase={phase}>
        <p className="take-recorder-title">{phase === "attached" ? t("recReady", { time: clock(seconds) }) : t("recReview")}</p>
        {take ? (
          <video className="take-recorder-screen" src={take.url} controls playsInline preload="metadata" aria-label={t("recReview")} />
        ) : null}
        <div className="take-recorder-actions">
          {phase === "review" ? (
            <button type="button" className="btn" onClick={useTake}>
              {icons ? <ParaIcon name="check" /> : null}
              {t("recUse")}
            </button>
          ) : null}
          <button type="button" className="btn btn-quiet" onClick={recordAgain}>
            {icons ? <ParaIcon name="record" /> : null}
            {t("recAgain")}
          </button>
          <button type="button" className="btn btn-quiet" onClick={cancel}>
            {t("recDelete")}
          </button>
        </div>
        {alert}
      </div>
    );
  }

  const recording = phase === "recording";
  return (
    <div className="take-recorder" data-phase={phase}>
      <div className="take-recorder-stage" data-camera={cameraOn ? "on" : "off"}>
        {cameraOn ? (
          <video ref={previewRef} className="take-recorder-screen is-mirrored" autoPlay muted playsInline aria-label={t("recPreview")} />
        ) : (
          <div className="take-recorder-off">{t("recCameraOffNote")}</div>
        )}
        {recording ? (
          <p className="take-recorder-badge" role="status">
            <i aria-hidden="true" />
            {t("recRecording")} {clock(elapsed)} / {clock(maxSeconds)}
          </p>
        ) : null}
      </div>
      {!recording ? <p className="take-recorder-hint">{t("recPreview")}</p> : null}
      <div className="take-recorder-actions">
        {recording ? (
          <button type="button" className="btn" onClick={stopRecording}>
            {icons ? <ParaIcon name="stop" /> : null}
            {t("recStop")}
          </button>
        ) : (
          <>
            <button type="button" className="btn" onClick={startRecording}>
              {icons ? <ParaIcon name="record" /> : null}
              {t("recStart")}
            </button>
            <button type="button" className="btn btn-quiet" aria-pressed={cameraOn} onClick={() => void openStream(!cameraOn)}>
              {cameraOn ? t("recCameraOn") : t("recCameraOff")}
            </button>
            <button type="button" className="btn btn-quiet" onClick={cancel}>
              {t("recCancel")}
            </button>
          </>
        )}
      </div>
      {alert}
    </div>
  );
}
