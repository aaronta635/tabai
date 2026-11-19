"use client";

import { ChevronDown } from "lucide-react";
import { createContext, useContext, useId, useState, type ReactNode } from "react";
import styles from "./Accordion.module.css";

interface AccordionState {
  openValue: string | null;
  toggle: (value: string) => void;
}

const AccordionContext = createContext<AccordionState | null>(null);
const ItemContext = createContext<{ value: string; triggerId: string; panelId: string } | null>(null);

function useAccordion() {
  const state = useContext(AccordionContext);
  if (!state) throw new Error("Accordion parts must be rendered inside <Accordion>");
  return state;
}

function useItem() {
  const item = useContext(ItemContext);
  if (!item) throw new Error("Accordion parts must be rendered inside <AccordionItem>");
  return item;
}

/** Plain accordion: hairline rows, a chevron that rotates open, no card background. One row open at a time. */
export function Accordion({ children }: { children: ReactNode }) {
  const [openValue, setOpenValue] = useState<string | null>(null);
  const toggle = (value: string) => setOpenValue((current) => (current === value ? null : value));
  return (
    <AccordionContext.Provider value={{ openValue, toggle }}>
      <div className={styles.root}>{children}</div>
    </AccordionContext.Provider>
  );
}

export function AccordionItem({ value, children }: { value: string; children: ReactNode }) {
  const { openValue } = useAccordion();
  const id = useId();
  const open = openValue === value;
  return (
    <ItemContext.Provider value={{ value, triggerId: `${id}-trigger`, panelId: `${id}-panel` }}>
      <div className={`${styles.item} ${open ? styles.open : ""}`}>{children}</div>
    </ItemContext.Provider>
  );
}

export function AccordionTrigger({ children }: { children: ReactNode }) {
  const { openValue, toggle } = useAccordion();
  const { value, triggerId, panelId } = useItem();
  return (
    <h3 className={styles.heading}>
      <button
        type="button"
        id={triggerId}
        className={styles.trigger}
        aria-expanded={openValue === value}
        aria-controls={panelId}
        onClick={() => toggle(value)}
      >
        <span>{children}</span>
        <ChevronDown className={styles.chevron} strokeWidth={1.75} aria-hidden="true" />
      </button>
    </h3>
  );
}

export function AccordionContent({ children }: { children: ReactNode }) {
  const { openValue } = useAccordion();
  const { value, triggerId, panelId } = useItem();
  return (
    <div
      id={panelId}
      role="region"
      aria-labelledby={triggerId}
      className={styles.panel}
      inert={openValue !== value}
    >
      <div className={styles.panelInner}>
        <p className={styles.content}>{children}</p>
      </div>
    </div>
  );
}
