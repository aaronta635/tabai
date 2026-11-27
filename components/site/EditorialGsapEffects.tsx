"use client";

import { useEffect } from "react";

type Gsap = typeof import("gsap").gsap;
type ScrollTriggerPlugin = typeof import("gsap/ScrollTrigger").ScrollTrigger;

/**
 * A single scoped choreography; readable static HTML is always the fallback.
 * GSAP is imported inside the effect so only the editorial home (/en and /vi) downloads it.
 */
export function EditorialEffects() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".para-editorial");
    if (!root) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    Promise.all([import("gsap"), import("gsap/ScrollTrigger")])
      .then(([{ gsap }, { ScrollTrigger }]) => {
        if (cancelled) return;
        gsap.registerPlugin(ScrollTrigger);
        cleanup = choreograph(root, gsap, ScrollTrigger);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);
  return null;
}

function choreograph(root: HTMLElement, gsap: Gsap, ScrollTrigger: ScrollTriggerPlugin) {
  let disposed = false;
  const media = gsap.matchMedia();
  const context = gsap.context(() => {
    // Buttons, links and anything holding them never move. Headings fade in once
    // (opacity only, no sliding); only the decorative artwork keeps its motion.
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const select = gsap.utils.selector(root);
      const fadeOnce = (target: Element | null, delay = 0) => {
        if (!target) return;
        gsap.fromTo(
          target,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 0.6,
            delay,
            ease: "power1.out",
            clearProps: "opacity",
            scrollTrigger: { trigger: target, start: "top 92%", once: true },
          },
        );
      };

      gsap.fromTo(
        select(".ed-hero h1"),
        { opacity: 0 },
        { opacity: 1, duration: 0.6, ease: "power1.out", clearProps: "opacity" },
      );
      gsap.fromTo(
        select(".ed-hero-art picture"),
        { scale: 0.92, rotation: -3, y: 12 },
        {
          scale: 1,
          rotation: 0,
          y: 0,
          duration: 0.9,
          delay: 0.12,
          ease: "power3.out",
          clearProps: "transform",
        },
      );

      root
        .querySelectorAll<HTMLElement>(
          ".para-feature h2,.ed-belief h2,.ed-close h2",
        )
        .forEach((heading) => fadeOnce(heading));

      const route = root.querySelector<SVGPathElement>(
        ".ed-belief-route path",
      );
      if (route) {
        const length = route.getTotalLength();
        gsap.fromTo(
          route,
          { strokeDasharray: length, strokeDashoffset: length },
          {
            strokeDashoffset: 0,
            ease: "none",
            scrollTrigger: {
              trigger: root.querySelector(".ed-belief"),
              start: "top 85%",
              end: "bottom 55%",
              scrub: 0.4,
              invalidateOnRefresh: true,
            },
          },
        );
        gsap.fromTo(
          root.querySelector(".ed-belief-route circle"),
          { scale: 0.5, transformOrigin: "50% 50%" },
          {
            scale: 1,
            duration: 0.7,
            clearProps: "transform,transformOrigin",
            scrollTrigger: { trigger: route, start: "top 88%", once: true },
          },
        );
      }
    });
    media.add(
      "(min-width: 851px) and (prefers-reduced-motion: no-preference)",
      () => {
        gsap.fromTo(
          ".ed-hero-art",
          { y: 0, scale: 1 },
          {
            y: -16,
            scale: 0.96,
            ease: "none",
            scrollTrigger: {
              trigger: ".ed-hero",
              start: "top top",
              end: "bottom top",
              scrub: 0.4,
              invalidateOnRefresh: true,
            },
          },
        );
      },
    );
  }, root);
  const refresh = () => {
    if (!disposed) ScrollTrigger.refresh();
  };
  document.fonts.ready.then(refresh).catch(() => {});
  const observer = new ResizeObserver(refresh);
  observer.observe(root);
  window.addEventListener("pageshow", refresh);
  return () => {
    disposed = true;
    observer.disconnect();
    window.removeEventListener("pageshow", refresh);
    media.revert();
    context.revert();
  };
}
