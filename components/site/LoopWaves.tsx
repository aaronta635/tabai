"use client";

import dynamic from "next/dynamic";
import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

const GradientWaves = dynamic(
  () =>
    import("@/components/site/react-bits/GradientWaves/GradientWaves").catch(
      () => () => null,
    ),
  { ssr: false, loading: () => null },
);

/** Atmosphere only. Never reads or writes the lesson's scroll/stage state. */
export const LoopWaves = memo(function LoopWaves({
  active = true,
  brightnessFactor,
}: {
  active?: boolean;
  brightnessFactor?: RefObject<number>;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [requested, setRequested] = useState(false);
  const [ready, setReady] = useState(false);
  const [failure, setFailure] = useState<"unavailable" | "performance" | null>(
    null,
  );
  const [config, setConfig] = useState({
    eligible: false,
    mobile: false,
    dark: false,
  });

  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const forced = matchMedia("(forced-colors: active)");
    const mobile = matchMedia("(max-width: 700px), (pointer: coarse)");
    const dark = matchMedia("(prefers-color-scheme: dark)");
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    const sync = () => {
      const eligible =
        !reduced.matches && !forced.matches && !connection?.saveData;
      setConfig({ eligible, mobile: mobile.matches, dark: dark.matches });
      if (!eligible) setReady(false);
    };
    const queries = [reduced, forced, mobile, dark];
    queries.forEach((query) => query.addEventListener("change", sync));
    sync();
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRequested(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px 0px" },
    );
    if (host.current) observer.observe(host.current);
    return () => {
      observer.disconnect();
      queries.forEach((query) => query.removeEventListener("change", sync));
    };
  }, []);

  const onReady = useCallback(() => setReady(true), []);
  const onError = useCallback(() => setFailure("unavailable"), []);
  const onSlow = useCallback(() => setFailure("performance"), []);
  const enhanced = config.eligible && !failure;

  return (
    <>
      <div
        ref={host}
        className="loop-atmosphere"
        aria-hidden="true"
        data-wave-state={
          failure || (!config.eligible ? "static" : ready ? "ready" : "loading")
        }
      >
        <div className="loop-waves-fallback" />
        <div className="loop-waves-effect">
          {requested && enhanced && (
            <GradientWaves
              horizonColor={config.dark ? "#8B5E34" : "#D6B98C"}
              waveColor="#8B5E34"
              crestColor={config.dark ? "#D6B98C" : "#F3EDE2"}
              backgroundColor="transparent"
              lightMode={false}
              speed={0.13}
              amplitude={2.4}
              waveScale={0.5}
              waveRatio={0.7}
              swell={18}
              turbulence={8}
              tilt={64}
              zoom={1.1}
              fogDepth={18}
              relief={0.72}
              sheen={0.18}
              brightness={1.15}
              brightnessFactor={brightnessFactor}
              grain={0}
              quality="low"
              intro={false}
              mouseInteraction={!config.mobile && active}
              parallaxStrength={0.12}
              mouseStrength={0.16}
              swellOnClick={false}
              paused={!active}
              dpr={config.mobile ? 0.65 : 0.85}
              maxWidth={config.mobile ? 720 : 1100}
              maxFps={config.mobile ? 24 : 30}
              onReady={onReady}
              onError={onError}
              onSlow={onSlow}
            />
          )}
        </div>
        <div className="loop-waves-scrim" />
      </div>
    </>
  );
});
