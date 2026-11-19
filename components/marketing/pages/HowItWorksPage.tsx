import { ArrowRight } from "lucide-react";
import { PageHead } from "../PageHead";
import { Section } from "../Section";
import { StepList } from "../StepList";
import { TryCta } from "../TryCta";
import styles from "./HowItWorksPage.module.css";

export function HowItWorksPage() {
  return (
  <>
    <PageHead
      eyebrow="Cách hoạt động"
      title="Giao bài, gửi bài, góp ý. Đơn giản."
      lead="PARA được làm để việc giao bài, gửi bài và góp ý giữa hai buổi học thật đơn giản."
    />

    <Section eyebrow="Từ bài giao đến lần tập sau" title="Mỗi lần tập, thầy cô đều nghe và góp ý.">
      <StepList
        items={[
          { title: "Giao bài", text: "Thầy cô giao một bài tập rõ." },
          { title: "Luyện tập", text: "Học viên tập bài đó ở nhà, giữa hai buổi học." },
          {
            title: "Gửi bài",
            text: "Học viên mở link, chọn bản thu âm hoặc video đã có, rồi gửi.",
          },
          { title: "Góp ý", text: "Thầy cô nghe và chỉ chỗ cần sửa." },
          {
            title: "Luyện lại",
            text: "Học viên tập lại. Phụ huynh được cho xem thì thấy con đã tập gì và thầy cô đã góp ý gì.",
          },
        ]}
      />
    </Section>

    <Section
      title="Học viên không cần học một phần mềm mới chỉ để gửi bài."
      sub="Link để gửi bài cho nhanh. Bài, bản thu và góp ý nằm cùng một chỗ thì mới dùng lâu."
    >
      <div className={styles.chips}>
        <span className={styles.chip}>Mở link</span>
        <ArrowRight size={18} className={styles.arrow} aria-hidden="true" />
        <span className={styles.chip}>Chọn bản thu</span>
        <ArrowRight size={18} className={styles.arrow} aria-hidden="true" />
        <span className={`${styles.chip} ${styles.chipMain}`}>Gửi bài</span>
      </div>
    </Section>

    <TryCta />
  </>
  );
}
