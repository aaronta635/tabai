import type { CSSProperties } from "react";
import { Play } from "lucide-react";
import styles from "./AppWindow.module.css";

const BARS = Array.from({ length: 30 }, (_, i) =>
  Math.round(24 + Math.abs(Math.sin(i * 0.65) * 44 + Math.sin(i * 1.7) * 16)),
);
const MARKED = [13, 14, 15];

export const AppWindow = () => (
  <div
    className={styles.window}
    role="img"
    aria-label="Minh hoạ màn hình Hôm nay tập gì của học viên trên web PARA"
  >
    <div className={styles.chrome}>
      <span className={styles.dots} aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span className={styles.url}>paramuzic.com/student</span>
    </div>

    <div className={styles.tabs}>
      <span className={styles.tabActive}>Hôm nay</span>
      <span>Bài tập</span>
      <span>
        Góp ý <i className={styles.dot} />
      </span>
      <span>Tiến bộ</span>
    </div>

    <div className={styles.body}>
      <div className={styles.left}>
        <div className={styles.head}>
          <h3 className={styles.title}>Hôm nay tập gì</h3>
          <p className={styles.week}>
            Tuần này <span className={styles.mono}>3/4</span> ngày
            <span className={styles.weekDots} aria-hidden="true">
              <i className={styles.on} />
              <i className={styles.on} />
              <i className={styles.on} />
              <i />
            </span>
          </p>
        </div>

        <div className={`${styles.card} ${styles.cardActive}`}>
          <div className={styles.cardTop}>
            <h4 className={styles.cardTitle}>Đổi hợp âm C – G</h4>
            <span className={styles.chip}>3 bản thu</span>
          </div>
          <p className={styles.label}>Chỗ cần chú ý</p>
          <p className={styles.text}>
            Ô <span className={styles.mono}>5–8</span>: đổi hợp âm sớm hơn nửa nhịp.
          </p>
          <div className={styles.cardFoot}>
            <span className={styles.muted}>Thầy An · hôm qua</span>
            <span className={styles.cta}>Tập ngay</span>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTop}>
            <h4 className={styles.cardTitle}>Intro fingerstyle</h4>
            <span className={`${styles.chip} ${styles.chipNew}`}>Mới</span>
          </div>
          <p className={styles.muted}>Thầy giao hôm qua · chưa tập</p>
        </div>
      </div>

      <aside className={styles.right}>
        <p className={styles.label}>Góp ý mới</p>
        <p className={styles.byline}>Thầy An · hôm qua</p>

        <div className={styles.player}>
          <span className={styles.playBtn}>
            <Play size={12} />
          </span>
          <div className={styles.wave} aria-hidden="true">
            {BARS.map((h, i) => (
              <i
                key={i}
                className={MARKED.includes(i) ? styles.barMarked : undefined}
                style={{ height: `${h}%`, ["--i" as string]: i } as CSSProperties}
              />
            ))}
          </div>
          <span className={`${styles.mono} ${styles.time}`}>0:24</span>
        </div>

        <p className={styles.quote}>“Giữ nhịp đều trong đoạn này.”</p>

        <div className={styles.next}>
          <p className={styles.label}>Chỗ cần sửa lần sau</p>
          <p className={styles.text}>Luyện chậm đoạn này, rồi thu lại.</p>
        </div>
      </aside>
    </div>
  </div>
);
