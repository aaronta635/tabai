import type { Locale } from "@/lib/site/content";

/** This brief's concise scene copy; technical VI labels are documented in handoff. */
export const studio = {
  en: {
    heroLines: ["See the progress", "between lessons."],
    platform:
      "PARA is a music learning platform in development, connecting practice, teacher feedback and the next step.",
    discover: "Explore PARA",
    concept: "Concept · Product in development",
    assignment: "Assignment link",
    recording: "Existing audio / video",
    feedback: "Teacher feedback",
    nextPractice: "A clear next step",
    pause: "Pause animation",
    resume: "Resume animation",
    next: "Next stage",
    loopLines: ["One attempt.", "A way forward."],
    loopIntro: "A simple submission link opens a wider learning loop.",
    steps: [
      "Share the task.",
      "Practise between lessons.",
      "Upload an existing audio or video recording.",
      "Get specific teacher feedback.",
      "Know what to practise next.",
    ],
    loopNote: "Illustrative workflow, not a live upload or player.",
    instruction: "Listen. Adjust. Try again.",
    continue: "The next attempt",
    listen: "Listen for the change",
    perspectivesLines: ["One journey.", "Three perspectives."],
    perspectives: [
      "Keep the work and your guidance together.",
      "Know what to practise next.",
      "Understand the learning between lessons.",
    ],
    parentNote:
      "An authorised view of progress, guided by the teacher. In exploration.",
    beliefLines: ["Feedback is a signal,", "not a verdict."],
    beliefCopy: "Every attempt helps reveal the next step.",
    closeLines: ["The next step", "is taking shape."],
    closeCopy: "PARA is in development.",
    closeAction: "Explore the product direction",
    openLoop: "An open loop, ready for what comes next.",
  },
  vi: {
    heroLines: ["Thấy từng bước tiến", "giữa những buổi học."],
    platform:
      "PARA là nền tảng học nhạc đang phát triển, kết nối luyện tập, góp ý của giáo viên và bước tiếp theo.",
    discover: "Khám phá PARA",
    concept: "Minh họa quy trình · Sản phẩm đang phát triển",
    assignment: "Liên kết giao bài",
    recording: "Bản thu âm / video đã có",
    feedback: "Góp ý của giáo viên",
    nextPractice: "Bước tiếp theo rõ ràng",
    pause: "Tạm dừng chuyển động",
    resume: "Tiếp tục chuyển động",
    next: "Bước kế tiếp",
    loopLines: ["Mỗi lần thử.", "Một hướng đi tiếp."],
    loopIntro: "Một đường link đơn giản mở ra cả vòng học liền mạch.",
    steps: [
      "Giao bài rõ ràng.",
      "Luyện tập giữa các buổi học.",
      "Gửi bản thu âm hoặc video đã có.",
      "Nhận góp ý cụ thể từ giáo viên.",
      "Biết mình nên luyện gì tiếp theo.",
    ],
    loopNote: "Minh họa quy trình, không phải công cụ gửi hay phát bản thu.",
    instruction: "Lắng nghe. Điều chỉnh. Thử lại.",
    continue: "Lần thử tiếp theo",
    listen: "Lắng nghe điều thay đổi",
    perspectivesLines: ["Một hành trình.", "Ba góc nhìn."],
    perspectives: [
      "Kết nối bài làm với sự hướng dẫn của bạn.",
      "Biết mình nên luyện gì tiếp theo.",
      "Hiểu hành trình học giữa những buổi học.",
    ],
    parentNote:
      "Đang tìm hiểu một góc nhìn được cấp quyền, có định hướng từ giáo viên.",
    beliefLines: ["Góp ý là tín hiệu để tiến bộ,", "không phải lời phán xét."],
    beliefCopy: "Mỗi lần luyện tập giúp làm rõ bước tiếp theo.",
    closeLines: ["Bước tiếp theo", "đang thành hình."],
    closeCopy: "PARA đang được phát triển.",
    closeAction: "Khám phá định hướng sản phẩm",
    openLoop: "Một vòng mở, sẵn sàng cho bước tiếp theo.",
  },
} as const;

export function sceneCopy(locale: Locale) {
  return studio[locale];
}
