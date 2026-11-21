"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** A single scoped choreography; readable static HTML is always the fallback. */
export function EditorialEffects() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".para-editorial");
    if (!root) return;
    const header = document.querySelector<HTMLElement>(".ed-header");
    let disposed = false;
    const media = gsap.matchMedia();
    const context = gsap.context(() => {
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const select = gsap.utils.selector(root);
        const opening = gsap.timeline({
          defaults: { duration: 0.65, ease: "power3.out" },
        });
        if (header)
          opening.fromTo(
            header.querySelectorAll(".ed-brand,.ed-nav-actions > *"),
            { y: -8 },
            { y: 0, stagger: 0.06, clearProps: "transform" },
            0,
          );
        opening
          .fromTo(
            select(".ed-hero h1 > span"),
            { y: 18, rotationX: 5, transformOrigin: "50% 100%" },
            {
              y: 0,
              rotationX: 0,
              stagger: 0.09,
              clearProps: "transform,transformOrigin",
            },
            0.05,
          )
          .fromTo(
            select(".ed-hero-copy > p,.ed-hero-actions"),
            { y: 10 },
            { y: 0, stagger: 0.09, clearProps: "transform" },
            0.14,
          )
          .fromTo(
            select(".ed-focus-word"),
            { "--ed-line-progress": 0 },
            { "--ed-line-progress": 1, duration: 0.8 },
            0.2,
          )
          .fromTo(
            select(".ed-hero-art picture"),
            { scale: 0.92, rotation: -3, y: 12 },
            {
              scale: 1,
              rotation: 0,
              y: 0,
              duration: 0.9,
              clearProps: "transform",
            },
            0.12,
          );

        root.querySelectorAll<HTMLElement>(".para-feature").forEach((panel) => {
          const scene = gsap.timeline({
            defaults: { duration: 0.6, ease: "power3.out" },
            scrollTrigger: {
              trigger: panel,
              start: "top 92%",
              once: true,
              invalidateOnRefresh: true,
            },
          });
          scene
            .fromTo(
              panel,
              { y: 16, scale: 0.99 },
              { y: 0, scale: 1, clearProps: "transform" },
              0,
            )
            .fromTo(
              panel.querySelector(".para-feature-eyebrow"),
              { x: -8 },
              { x: 0, clearProps: "transform" },
              0.05,
            )
            .fromTo(
              panel.querySelectorAll("h2 .ed-motion-word"),
              { y: 14, rotationX: 6 },
              {
                y: 0,
                rotationX: 0,
                duration: 0.55,
                stagger: 0.035,
                clearProps: "transform",
              },
              0.08,
            )
            .fromTo(
              panel.querySelector(".para-feature-summary"),
              { y: 8 },
              { y: 0, clearProps: "transform" },
              0.12,
            )
            .fromTo(
              panel.querySelector(".para-feature-icon"),
              {
                y: -8,
                scale: 0.85,
                rotation: panel.classList.contains("para-feature--next")
                  ? -35
                  : -8,
              },
              {
                y: 0,
                scale: 1,
                rotation: 0,
                duration: 0.7,
                clearProps: "transform",
              },
              0.12,
            )
            .fromTo(
              panel.querySelector(".para-feature-media"),
              { y: -8, scale: 0.98 },
              { y: 0, scale: 1, duration: 0.7, clearProps: "transform" },
              0.1,
            )
            .fromTo(
              panel.querySelectorAll(
                ".para-demo-toolbar > *,.para-demo-caption",
              ),
              { y: 6 },
              { y: 0, stagger: 0.04, clearProps: "transform" },
              0.16,
            );
        });

        root
          .querySelectorAll<HTMLElement>(".ed-belief h2,.ed-close h2")
          .forEach((heading) => {
            gsap.fromTo(
              heading.querySelectorAll(".ed-motion-word"),
              { y: 14, rotationX: 5 },
              {
                y: 0,
                rotationX: 0,
                duration: 0.6,
                stagger: 0.045,
                ease: "power3.out",
                clearProps: "transform",
                scrollTrigger: {
                  trigger: heading,
                  start: "top 90%",
                  once: true,
                },
              },
            );
          });
        const signal = root.querySelector(".ed-signal-word");
        if (signal)
          gsap.fromTo(
            signal,
            { scale: 0.95, "--ed-line-progress": 0 },
            {
              scale: 1,
              "--ed-line-progress": 1,
              duration: 0.7,
              ease: "power3.out",
              clearProps: "transform",
              scrollTrigger: { trigger: signal, start: "top 88%", once: true },
            },
          );

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
        gsap.fromTo(
          select(".ed-close .ed-button"),
          { y: 10, scale: 0.96 },
          {
            y: 0,
            scale: 1,
            duration: 0.65,
            ease: "power3.out",
            clearProps: "transform",
            scrollTrigger: {
              trigger: ".ed-close",
              start: "top 90%",
              once: true,
            },
          },
        );
        gsap.fromTo(
          select(".ed-footer > *"),
          { y: 8 },
          {
            y: 0,
            duration: 0.55,
            stagger: 0.08,
            ease: "power3.out",
            clearProps: "transform",
            scrollTrigger: {
              trigger: ".ed-footer",
              start: "top 96%",
              once: true,
            },
          },
        );

        // GSAP owns the interaction transforms too; media changes revert every tween.
        const hoverContext = gsap.context(() => {}, root);
        const cleanups: Array<() => void> = [];
        const controls = [
          ...root.querySelectorAll<HTMLElement>(
            ".ed-button,.para-demo-toolbar button,.ed-footer a",
          ),
          ...(header?.querySelectorAll<HTMLElement>("a") ?? []),
        ];
        controls.forEach((element) => {
          const enter = () =>
            hoverContext.add(() => {
              gsap.to(element, {
                y: -2,
                scale: element.classList.contains("ed-button") ? 1.025 : 1,
                duration: 0.2,
                ease: "power2.out",
                overwrite: "auto",
              });
            });
          const leave = () =>
            hoverContext.add(() => {
              gsap.to(element, {
                y: 0,
                scale: 1,
                duration: 0.25,
                ease: "power2.out",
                overwrite: "auto",
                clearProps: "transform",
              });
            });
          element.addEventListener("pointerenter", enter);
          element.addEventListener("pointerleave", leave);
          element.addEventListener("focus", enter);
          element.addEventListener("blur", leave);
          cleanups.push(() => {
            element.removeEventListener("pointerenter", enter);
            element.removeEventListener("pointerleave", leave);
            element.removeEventListener("focus", enter);
            element.removeEventListener("blur", leave);
          });
        });
        return () => {
          cleanups.forEach((cleanup) => cleanup());
          hoverContext.revert();
        };
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
  }, []);
  return null;
}
