"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type { Locale } from "@/lib/site/content";

const photographs = [
  {
    file: "stage-duo",
    width: 900,
    height: 1358,
    en: "Two PARA founders performing together on stage.",
    vi: "Hai nhà sáng lập PARA cùng biểu diễn trên sân khấu.",
  },
  {
    file: "guitar-stage",
    width: 1436,
    height: 1095,
    en: "A PARA founder playing guitar on stage.",
    vi: "Một nhà sáng lập PARA chơi guitar trên sân khấu.",
  },
  {
    file: "bass-performance",
    width: 800,
    height: 1421,
    en: "A PARA founder playing bass among other musicians.",
    vi: "Một nhà sáng lập PARA chơi guitar bass cùng các nhạc công khác.",
  },
] as const;
const PIXELS_PER_SECOND = 28;

/** Measured sequence period includes its final gap. Copies are decorative DOM
 * siblings, filled synchronously before paint; React owns only the originals.
 * WAAPI owns the track transform. No React renders or rAF loop per frame. */
export function PerformanceReel({ locale }: { locale: Locale }) {
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const sequence = useRef<HTMLDivElement>(null);
  const copies = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const windowNode = viewport.current;
    const strip = track.current;
    const original = sequence.current;
    const duplicates = copies.current;
    if (!windowNode || !strip || !original || !duplicates) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let animation: Animation | null = null;
    let period = 0;
    let duration = 0;
    let phase = 0;
    let visible = false;
    let disposed = false;
    const sync = () => {
      const playing = visible && !document.hidden && !reduced.matches;
      strip.dataset.playing = String(playing);
      if (playing) animation?.play();
      else animation?.pause();
    };
    const remember = () => {
      if (animation && duration && typeof animation.currentTime === "number")
        phase = (animation.currentTime % duration) / duration;
    };
    const fit = () => {
      if (disposed) return;
      if (reduced.matches) {
        remember();
        animation?.cancel();
        animation = null;
        duplicates.replaceChildren();
        strip.style.removeProperty("--reel-period");
        strip.style.transform = "none";
        period = 0;
        sync();
        return;
      }
      // Whole-pixel periods also keep filtered grain/photos on the same raster
      // grid on both sides of a wrap. Include the sequence's trailing gap.
      const gap = parseFloat(getComputedStyle(original).columnGap) || 0;
      const measured = Math.ceil(
        Array.from(original.children).reduce(
          (sum, frame) => sum + frame.getBoundingClientRect().width + gap,
          0,
        ),
      );
      if (!measured) return;
      strip.style.setProperty("--reel-period", `${measured}px`);
      // One period before the viewport, enough periods beyond its right edge,
      // plus one safety period for fractional pixels and live resizing.
      const count = Math.ceil(windowNode.clientWidth / measured) + 2;
      while (duplicates.children.length < count - 1) {
        const clone = original.cloneNode(true) as HTMLElement;
        clone.setAttribute("aria-hidden", "true");
        clone.querySelectorAll("img").forEach((img) => {
          img.alt = "";
        });
        duplicates.append(clone);
      }
      while (duplicates.children.length > count - 1)
        duplicates.lastChild?.remove();
      if (Math.abs(period - measured) > 0.1 || !animation) {
        remember();
        animation?.cancel();
        period = measured;
        duration = (period / PIXELS_PER_SECOND) * 1000;
        strip.style.removeProperty("transform");
        animation = strip.animate(
          [
            { transform: `translate3d(${-period}px,0,0)` },
            { transform: "translate3d(0,0,0)" },
          ],
          { duration, iterations: Infinity, easing: "linear" },
        );
        animation.currentTime = phase * duration;
      }
      sync();
    };
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    visibility.observe(windowNode);
    const sizes = new ResizeObserver(fit);
    sizes.observe(windowNode);
    sizes.observe(original);
    original.addEventListener("load", fit, true);
    reduced.addEventListener("change", fit);
    document.addEventListener("visibilitychange", sync);
    document.fonts.ready.then(fit);
    fit();
    return () => {
      disposed = true;
      animation?.cancel();
      sizes.disconnect();
      visibility.disconnect();
      original.removeEventListener("load", fit, true);
      reduced.removeEventListener("change", fit);
      document.removeEventListener("visibilitychange", sync);
      duplicates.replaceChildren();
    };
  }, []);

  return (
    <figure className="performance-reel">
      <div
        ref={viewport}
        id="performance-reel-viewport"
        className="reel-viewport"
      >
        <div ref={track} className="reel-track">
          <div ref={sequence} className="reel-sequence">
            {photographs.map((photo) => (
              <div
                className={`reel-frame reel-frame-${photo.file}`}
                key={photo.file}
                style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
              >
                <Image
                  src={`/images/performance/${photo.file}.webp`}
                  alt={photo[locale]}
                  width={photo.width}
                  height={photo.height}
                  sizes="(max-width: 700px) 320px, (min-width: 2400px) 650px, 480px"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
          <div ref={copies} className="reel-copies" aria-hidden="true" />
        </div>
      </div>
    </figure>
  );
}
