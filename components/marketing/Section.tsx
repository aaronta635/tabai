import type { ReactNode } from "react";
import styles from "./Section.module.css";

interface SectionProps {
  id?: string;
  eyebrow?: string;
  title?: string;
  sub?: string;
  children?: ReactNode;
}

export const Section = ({ id, eyebrow, title, sub, children }: SectionProps) => (
  <section id={id} className={styles.section}>
    <div className={styles.container}>
      {(eyebrow || title || sub) && (
        <div className={styles.head}>
          {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
          {title && <h2 className={styles.title}>{title}</h2>}
          {sub && <p className={styles.sub}>{sub}</p>}
        </div>
      )}
      {children}
    </div>
  </section>
);
