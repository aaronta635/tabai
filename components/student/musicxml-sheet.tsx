"use client";

import { useEffect, useRef, useState } from "react";
import type * as AlphaTab from "@coderline/alphatab";

export function MusicXmlSheet({ sheetUrl, openSheet }: { sheetUrl: string; openSheet: string }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    const scroller = scrollerRef.current;
    if (!host || !scroller || failed) return;

    let disposed = false;
    let api: AlphaTab.AlphaTabApi | null = null;

    void import("@coderline/alphatab")
      .then((alphaTab) => {
        if (disposed) return;
        const settings = new alphaTab.Settings();
        settings.core.useWorkers = false;
        settings.core.fontDirectory = "/alphatab/font/";
        settings.player.playerMode = alphaTab.PlayerMode.Disabled;
        settings.player.scrollElement = scroller;
        const instance = new alphaTab.AlphaTabApi(host, settings);
        api = instance;
        let sawScore = false;
        instance.scoreLoaded.on(() => {
          sawScore = true;
        });
        instance.error.on(() => {
          if (!disposed && !sawScore) setFailed(true);
        });
        instance.load(sheetUrl);
      })
      .catch(() => {
        if (!disposed) setFailed(true);
      });

    return () => {
      disposed = true;
      api?.destroy();
    };
  }, [failed, sheetUrl]);

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
