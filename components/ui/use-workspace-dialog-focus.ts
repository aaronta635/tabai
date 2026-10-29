"use client";

import { useEffect, useRef, type RefObject } from "react";

/** Keyboard and background isolation for existing workspace dialogs. */
export function useWorkspaceDialogFocus(ref: RefObject<HTMLDivElement | null>, open: boolean, onClose: () => void) {
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; }, [onClose]);
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const siblings = new Map<HTMLElement, boolean>();
    let branch: HTMLElement = dialog;
    while (branch.parentElement && !branch.classList.contains("student-ui")) {
      for (const sibling of Array.from(branch.parentElement.children)) {
        if (sibling !== branch && sibling instanceof HTMLElement) {
          siblings.set(sibling, sibling.inert);
          sibling.inert = true;
        }
      }
      branch = branch.parentElement;
    }
    const controls = () => Array.from(dialog.querySelectorAll<HTMLElement>("button:not(:disabled):not([tabindex='-1']), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex='0']"));
    controls()[0]?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); close.current(); }
      if (event.key !== "Tab") return;
      const nodes = controls();
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    dialog.addEventListener("keydown", keydown);
    return () => {
      dialog.removeEventListener("keydown", keydown);
      siblings.forEach((inert, sibling) => { sibling.inert = inert; });
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [open, ref]);
}
