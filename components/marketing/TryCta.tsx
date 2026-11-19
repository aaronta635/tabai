import { PrimaryButton } from "./PrimaryButton";
import { siteLinks } from "@/lib/marketing/site-links";
import styles from "./TryCta.module.css";

export const TryCta = () => (
  <section className={styles.cta}>
    <div className={styles.inner}>
      <h2 className={styles.title}>Thử giao bài trên PARA.</h2>
      <PrimaryButton href={siteLinks.signup} size="lg">
        Dùng thử miễn phí
      </PrimaryButton>
    </div>
  </section>
);
