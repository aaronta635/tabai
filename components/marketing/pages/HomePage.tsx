"use client";

import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  Mic,
  Headphones,
  Repeat,
  TrendingUp,
  Check,
  Play,
} from "lucide-react";
import { Button } from "../Button";
import { PrimaryButton } from "../PrimaryButton";
import { ClassCodeForm } from "../ClassCodeForm";
import { AppWindow } from "../AppWindow";
import { IconTile, type TileTone } from "../IconTile";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "../Accordion";
import { useScrollReveal } from "../useScrollReveal";
import { faqItems } from "@/lib/marketing/faq-items";
import { marketingPath, siteLinks } from "@/lib/marketing/site-links";
import styles from "./HomePage.module.css";

const STEPS: {
  icon: typeof Mic;
  tone: TileTone;
  title: string;
  text: string;
}[] = [
  {
    icon: ClipboardList,
    tone: "blue",
    title: "Giao bài",
    text: "Thầy cô giao bài qua một đường link.",
  },
  {
    icon: Mic,
    tone: "rose",
    title: "Tập và thu",
    text: "Thu nhiều lần, chọn bản tốt nhất để gửi.",
  },
  {
    icon: Headphones,
    tone: "copper",
    title: "Góp ý",
    text: "Thầy cô góp ý đúng đoạn, đúng ô nhịp.",
  },
  {
    icon: Repeat,
    tone: "amber",
    title: "Tập lại",
    text: "Sửa đúng chỗ, thu bản mới.",
  },
  {
    icon: TrendingUp,
    tone: "green",
    title: "Tiến bộ",
    text: "Mỗi bản thu được giữ lại để nghe lại.",
  },
];

const TRUST = [
  "Ghi âm là đủ, không cần bật camera",
  "Camera tắt mặc định với học viên dưới 18 tuổi",
  "Bạn chọn bản thu nào gửi đi",
  "Chia sẻ cần đồng ý, không công khai mặc định",
  "Không bảng xếp hạng",
  "Phụ huynh thấy tiến bộ, không thấy số lần mở app",
];

const HOME_FAQ = faqItems.filter((f) => f.home);

export function HomePage() {
  const revealSteps = useScrollReveal<HTMLDivElement>();
  const revealNote = useScrollReveal<HTMLDivElement>();
  const revealTrust = useScrollReveal<HTMLUListElement>();
  const revealFaq = useScrollReveal<HTMLDivElement>();
  const revealFinal = useScrollReveal<HTMLDivElement>();

  return (
    <>
      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroText}>
            <p className={styles.eyebrow}>Tập giữa hai buổi học</p>
            <h1 className={styles.h1}>
              <span className={styles.line}>Biết cần tập gì.</span>
              <span className={styles.line}>Biết cần sửa gì.</span>
              <span className={styles.hl}>Thấy mình tiến bộ.</span>
            </h1>
            <p className={styles.lead}>
              Buổi học chỉ có một giờ. Tiến bộ nằm ở những ngày còn lại. PARA giúp bạn tập
              giữa hai buổi, cùng thầy cô của mình.
            </p>
            <p className={styles.teacherLine}>
              <IconTile icon={Headphones} tone="copper" size="sm" />
              <span>
                <strong>Thầy cô:</strong> giao bài một lần, nghe đúng chỗ cần nghe.
              </span>
            </p>
            <div className={styles.ctas}>
              <PrimaryButton href={siteLinks.signup} size="lg">
                Dùng thử miễn phí
              </PrimaryButton>
              <Button asChild size="lg" shape="pill" variant="outline">
                <a href={siteLinks.teacherLogin}>
                  Tôi là thầy cô
                </a>
              </Button>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.windowGlow}>
              <AppWindow />
            </div>
            <p className={styles.illus}>Minh hoạ giao diện</p>
          </div>
        </div>
      </section>

      {/* LOOP */}
      <section id="cach-hoat-dong" className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <p className={styles.eyebrow}>Cách hoạt động</p>
            <h2 className={styles.h2}>Một vòng đơn giản.</h2>
          </div>
          <div ref={revealSteps} className={`${styles.steps} ${styles.stagger}`}>
            {STEPS.map((s, i) => (
              <div key={s.title} className={styles.step}>
                <IconTile icon={s.icon} tone={s.tone} />
                <span className={styles.stepIdx}>{String(i + 1).padStart(2, "0")}</span>
                <h3 className={styles.stepTitle}>{s.title}</h3>
                <p className={styles.stepText}>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PARENT NOTE */}
      <section id="phu-huynh" className={styles.section}>
        <div className={`${styles.container} ${styles.noteGrid}`}>
          <div className={styles.noteText}>
            <p className={styles.eyebrow}>Cho phụ huynh · đang hoàn thiện</p>
            <h2 className={styles.h2Left}>Một tin ngắn mỗi tuần. Không phải bảng chấm công.</h2>
            <p className={styles.subLeft}>
              Con đang học gì, đã khá hơn ở đâu, thầy cô nói gì. Tin luôn mang lời của thầy
              cô.
            </p>
          </div>

          <div ref={revealNote} className={styles.noteReveal}>
            <div className={styles.note}>
              <span className={styles.noteStamp}>Ví dụ</span>
              <h3 className={styles.noteTitle}>Tuần này của Bin</h3>
              <dl className={styles.noteList}>
                <div>
                  <dt>Đang học</dt>
                  <dd>Chuyển hợp âm C–G.</dd>
                </div>
                <div>
                  <dt>Đã khá hơn</dt>
                  <dd>Chuyển hợp âm mượt hơn tuần trước, không còn khựng ở ô 5–8.</dd>
                </div>
                <div>
                  <dt>Thầy An nói</dt>
                  <dd className={styles.quote}>
                    “Giữ nhịp tốt rồi. Tuần sau tập chậm lại đoạn điệp khúc.”
                  </dd>
                </div>
                <div>
                  <dt>Tập đều</dt>
                  <dd>4 ngày trong tuần, dành nhiều nhất cho đoạn chuyển hợp âm.</dd>
                </div>
              </dl>
              <div className={styles.noteFoot}>
                <span>
                  <Play size={12} /> Nghe bản thu tuần này
                </span>
                <span>
                  <Play size={12} /> Nghe lại bản tuần trước
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST (compact) */}
      <section id="niem-tin" className={styles.trust}>
        <div className={styles.container}>
          <div className={styles.trustCard}>
            <div>
              <h2 className={styles.h2Small}>Bản thu là của bạn.</h2>
              <p className={styles.trustSub}>Bạn chọn gửi gì, và ai được xem.</p>
            </div>
            <ul ref={revealTrust} className={`${styles.trustList} ${styles.stagger}`}>
              {TRUST.map((t) => (
                <li key={t}>
                  <span className={styles.tick}>
                    <Check size={12} strokeWidth={3} aria-hidden="true" />
                  </span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="hoi-dap" className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <p className={styles.eyebrow}>Hỏi đáp</p>
            <h2 className={styles.h2}>Câu hỏi thường gặp.</h2>
          </div>
          <div ref={revealFaq} className={styles.faq}>
            <Accordion>
              {HOME_FAQ.map((f, i) => (
                <AccordionItem key={f.q} value={`item-${i}`}>
                  <AccordionTrigger>{f.q}</AccordionTrigger>
                  <AccordionContent>{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            <Link href={marketingPath("/faq")} className={styles.more}>
              Xem tất cả câu hỏi <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.finalWrap}>
            <div ref={revealFinal} className={styles.final}>
              <h2 className={styles.finalTitle}>Giao bài. Nghe bài. Góp ý.</h2>
              <div className={styles.finalCta}>
                <PrimaryButton href={siteLinks.signup} size="lg">
                  Dùng thử miễn phí
                </PrimaryButton>
              </div>
              <ClassCodeForm className={styles.finalCode} />
              <p className={styles.finalLinks}>
                <a href={siteLinks.teacherLogin}>
                  Tôi là thầy cô
                </a>
                <span aria-hidden="true">·</span>
                <a href={siteLinks.studentLogin}>
                  Tôi là học viên
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
