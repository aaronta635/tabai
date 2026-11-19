import type { ReactNode } from "react";
import styles from "./PageHead.module.css";

interface PageHeadProps {
  eyebrow: string;
  title: string;
  lead?: string;
  visual?: ReactNode;
}

/** Top of every inner page. The only place the notebook lines appear besides the home hero. */
export const PageHead = ({ eyebrow, title, lead, visual }: PageHeadProps) => (
  <section className={styles.head}>
    <div className={`${styles.inner} ${visual ? styles.withVisual : ""}`}>
      <div className={styles.text}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 className={styles.title}>{title}</h1>
        {lead && <p className={styles.lead}>{lead}</p>}
      </div>
      {visual && <div className={styles.visual}>{visual}</div>}
    </div>
  </section>
);
