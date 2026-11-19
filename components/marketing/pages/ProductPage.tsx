import { PageHead } from "../PageHead";
import { Section } from "../Section";
import { StepList } from "../StepList";
import { TryCta } from "../TryCta";
import { AppWindow } from "../AppWindow";

export function ProductPage() {
  return (
  <>
    <PageHead
      eyebrow="PARA làm gì"
      title="Thầy cô nghe lại được mỗi lần tập ở nhà."
      lead="Phần lớn thời gian là tự tập ở nhà. PARA giúp thầy cô giao bài, nghe bài học viên gửi và hướng dẫn chỗ cần sửa giữa hai buổi học."
      visual={<AppWindow />}
    />

    <Section eyebrow="Khá hơn theo thời gian" title="Luyện tập, góp ý, luyện lại.">
      <StepList
        items={[
          {
            title: "Luyện tập",
            text: "Bài thầy cô giao và bản thu của học viên nằm cùng một chỗ.",
          },
          {
            title: "Góp ý",
            text: "Thầy cô nghe bài và chỉ đúng chỗ học viên cần sửa lần sau.",
          },
          {
            title: "Khá hơn theo thời gian",
            text: "Xem lại bài đã giao, lần đã tập, và góp ý trước đó.",
          },
        ]}
      />
    </Section>

    <Section
      title="PARA giữ lời thầy giữa hai buổi học, không thay thầy."
      sub="PARA giữ bài, bản thu và góp ý cùng một chỗ. Thầy cô vẫn là người giao bài, nghe bài và chỉ chỗ cần sửa."
    />

    <TryCta />
  </>
  );
}
