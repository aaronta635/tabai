"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useTranslations } from "next-intl";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5];

type Props = {
  src: string;
  label?: string;
  videoRef?: RefObject<HTMLVideoElement | null>;
};

export function LoopSpeedPlayer({ src, label, videoRef }: Props) {
  const t = useTranslations("student");
  const innerRef = useRef<HTMLVideoElement>(null);
  const nodeRef = videoRef ?? innerRef;
  const [duration, setDuration] = useState(0);
  const [loopOn, setLoopOn] = useState(false);
  const [loopStart, setLoopStart] = useState(0);
  const [loopEnd, setLoopEnd] = useState(0);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    const video = nodeRef.current;
    if (video) video.playbackRate = speed;
  }, [speed, src, nodeRef]);

  useEffect(() => {
    const video = nodeRef.current;
    if (!video || !loopOn || loopEnd <= loopStart) return;
    const onTime = () => {
      if (video.currentTime >= loopEnd) {
        video.currentTime = loopStart;
      }
    };
    video.addEventListener("timeupdate", onTime);
    return () => video.removeEventListener("timeupdate", onTime);
  }, [loopOn, loopStart, loopEnd, src, nodeRef]);

  return (
    <div>
      {label ? <p className="mb-2 text-sm">{label}</p> : null}
      <video
        ref={nodeRef}
        src={src}
        controls
        playsInline
        className="w-full rounded-2xl bg-black"
        onLoadedMetadata={(event) => {
          const next = event.currentTarget.duration || 0;
          setDuration(next);
          setLoopEnd(next);
          event.currentTarget.playbackRate = speed;
        }}
      />
      <div className="mt-3 space-y-2 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-ink-soft">{t("playbackSpeed")}</span>
          {SPEEDS.map((value) => (
            <button
              key={value}
              type="button"
              className={`rounded-full px-3 py-1 ${speed === value ? "bg-beat text-white" : "border border-ink/15"}`}
              onClick={() => setSpeed(value)}
            >
              {value}×
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={loopOn}
            onChange={(event) => {
              setLoopOn(event.target.checked);
              if (event.target.checked && nodeRef.current) {
                nodeRef.current.currentTime = loopStart;
              }
            }}
          />
          {t("loop")}
        </label>
        {loopOn && duration > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            <label>
              {t("loopStart")} {loopStart.toFixed(0)}s
              <input
                type="range"
                min={0}
                max={duration}
                step={0.5}
                value={loopStart}
                className="mt-1 w-full"
                onChange={(event) => {
                  const value = Number(event.target.value);
                  setLoopStart(Math.min(value, Math.max(0, loopEnd - 1)));
                }}
              />
            </label>
            <label>
              {t("loopEnd")} {loopEnd.toFixed(0)}s
              <input
                type="range"
                min={0}
                max={duration}
                step={0.5}
                value={loopEnd}
                className="mt-1 w-full"
                onChange={(event) => {
                  const value = Number(event.target.value);
                  setLoopEnd(Math.max(value, Math.min(duration, loopStart + 1)));
                }}
              />
            </label>
          </div>
        ) : null}
      </div>
    </div>
  );
}
