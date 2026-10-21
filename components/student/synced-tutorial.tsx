"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import type * as AlphaTab from "@coderline/alphatab";
import { LoopSpeedPlayer } from "@/components/student/loop-speed-player";
import { mediaFollow } from "@/lib/sheet-sync";
import type { SheetSyncPoint } from "@/lib/score-model";

type ExternalOutput = {
  handler?: AlphaTab.synth.IExternalMediaHandler;
  updatePosition(currentTime: number): void;
};

function SyncedSheet({
  sheetUrl,
  points,
  videoRef,
  openSheet,
}: {
  sheetUrl: string;
  points: SheetSyncPoint[];
  videoRef: RefObject<HTMLVideoElement | null>;
  openSheet: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const pointsKey = JSON.stringify(points);

  useEffect(() => {
    const host = hostRef.current;
    const scroller = scrollerRef.current;
    const video = videoRef.current;
    if (!host || !scroller || !video || failed) return;

    let disposed = false;
    let holding = false;
    let heldBar = -1;
    let timer = 0;
    let api: AlphaTab.AlphaTabApi | null = null;
    const anchors = JSON.parse(pointsKey) as SheetSyncPoint[];

    const follow = () => {
      const node = videoRef.current;
      const current = api;
      if (!node || !current?.score || disposed) return;
      const decision = mediaFollow(node.currentTime, anchors);
      if (decision !== "follow") {
        const bar = current.score.masterBars[decision.holdBar - 1];
        if (!bar || !current.isReadyForPlayback) return;
        if (heldBar === decision.holdBar) return;
        heldBar = decision.holdBar;
        holding = true;
        current.tickPosition = bar.start;
        holding = false;
        return;
      }
      heldBar = -1;
      const output = current.player?.output as ExternalOutput | undefined;
      output?.updatePosition(node.currentTime * 1000);
      if (!node.paused || !current.isReadyForPlayback) return;
      holding = true;
      current.timePosition = current.timePosition;
      holding = false;
    };

    const start = () => {
      window.clearInterval(timer);
      timer = window.setInterval(follow, 50);
    };
    const stop = () => window.clearInterval(timer);

    video.addEventListener("timeupdate", follow);
    video.addEventListener("seeked", follow);
    video.addEventListener("play", start);
    video.addEventListener("pause", stop);
    video.addEventListener("ended", stop);
    if (!video.paused) start();

    void import("@coderline/alphatab").then((alphaTab) => {
      if (disposed) return;
      const settings = new alphaTab.Settings();
      settings.core.useWorkers = false;
      settings.core.fontDirectory = "/alphatab/font/";
      settings.player.playerMode = alphaTab.PlayerMode.EnabledExternalMedia;
      settings.player.enableCursor = true;
      settings.player.enableUserInteraction = true;
      settings.player.scrollElement = scroller;
      settings.player.scrollMode = alphaTab.ScrollMode.OffScreen;
      settings.player.enableAnimatedBeatCursor = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const instance = new alphaTab.AlphaTabApi(host, settings);
      api = instance;
      let sawScore = false;
      instance.scoreLoaded.on((score) => {
        sawScore = true;
        score.applyFlatSyncPoints(
          anchors.map((point) => ({
            barIndex: point.bar - 1,
            barPosition: 0,
            barOccurence: 0,
            millisecondOffset: Math.round(point.t * 1000),
          })),
        );
      });
      instance.beatMouseDown.on((beat) => {
        if (!instance.isReadyForPlayback) return;
        instance.tickPosition = beat.absolutePlaybackStart;
      });
      instance.playerReady.on(() => {
        const output = instance.player?.output as ExternalOutput | undefined;
        if (!output) return;
        output.handler = {
          get backingTrackDuration() {
            const duration = videoRef.current?.duration ?? 0;
            return Number.isFinite(duration) ? duration * 1000 : 0;
          },
          get playbackRate() {
            return videoRef.current?.playbackRate || 1;
          },
          set playbackRate(_value: number) {
            // The speed buttons own playbackRate. currentTime stays on the file clock.
          },
          get masterVolume() {
            return videoRef.current?.volume ?? 1;
          },
          set masterVolume(value: number) {
            const node = videoRef.current;
            if (node) node.volume = value;
          },
          seekTo(time: number) {
            const node = videoRef.current;
            if (!node || holding) return;
            const seconds = time / 1000;
            const start = anchors[0]?.t ?? seconds;
            const end = anchors[anchors.length - 1]?.t ?? seconds;
            const next = Math.min(end, Math.max(start, seconds));
            if (Math.abs(node.currentTime - next) < 0.05) return;
            node.currentTime = next;
          },
          play() {
            void videoRef.current?.play();
          },
          pause() {
            videoRef.current?.pause();
          },
        };
        follow();
      });
      instance.error.on((error: unknown) => {
        if (!disposed && !sawScore) {
          const message = error instanceof Error ? error.message : String(error);
          setFailed(message || "sheet failed");
        }
      });
      instance.load(sheetUrl);
    }).catch((error: unknown) => {
      if (!disposed) setFailed(error instanceof Error ? error.message : "sheet failed");
    });

    return () => {
      disposed = true;
      window.clearInterval(timer);
      video.removeEventListener("timeupdate", follow);
      video.removeEventListener("seeked", follow);
      video.removeEventListener("play", start);
      video.removeEventListener("pause", stop);
      video.removeEventListener("ended", stop);
      api?.destroy();
    };
  }, [failed, pointsKey, sheetUrl, videoRef]);

  if (failed) {
    return (
      <a href={sheetUrl} target="_blank" rel="noreferrer" className="text-sm underline">
        {openSheet}
      </a>
    );
  }

  return (
    <div ref={scrollerRef} className="synced-sheet max-h-96 w-full overflow-auto rounded-2xl bg-white">
      <div ref={hostRef} />
    </div>
  );
}

export function SyncedTutorial({
  tutorialUrl,
  sheetUrl,
  points,
  videoLabel,
  sheetLabel,
  openSheet,
  compact = false,
  tiled = false,
  className,
}: {
  tutorialUrl: string;
  sheetUrl: string;
  points: SheetSyncPoint[];
  videoLabel?: string;
  sheetLabel?: string;
  openSheet: string;
  compact?: boolean;
  tiled?: boolean;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const frame = tiled ? "contents" : compact ? "basis-full space-y-3" : "space-y-5";

  return (
    <div className={className ? `${frame} ${className}` : frame}>
      <section className={tiled ? "tile" : undefined}>
        <LoopSpeedPlayer src={tutorialUrl} label={videoLabel} videoRef={videoRef} compact={compact} />
      </section>
      <section className={tiled ? "tile" : undefined}>
        {sheetLabel ? <p className="mb-2 text-sm">{sheetLabel}</p> : null}
        <SyncedSheet sheetUrl={sheetUrl} points={points} videoRef={videoRef} openSheet={openSheet} />
      </section>
    </div>
  );
}
