import type { Locale } from "@/lib/site/content";

// Additions from the PARA resource pack. Existing dictionaries remain the source
// for the product story, audience roles, FAQ and development qualifications.
export const paraContent = {
  en: {
    concept: "Conceptual learning story · Product in development",
    comparison:
      "Illustrative attempts · Teacher guidance · Not measured performance data",
    play: "Play story",
    pause: "Pause story",
    next: "Next step",
    storyLabel: "A learning loop, illustrated",
    storyStages: [
      "Assign",
      "Send a recording",
      "Teacher feedback",
      "Practise again",
    ],
    storyDetails: [
      "The teacher shares a clear practice task.",
      "The student opens a link and uploads an existing audio or video recording.",
      "The teacher gives specific feedback on the attempt.",
      "The student knows what to practise next and tries again.",
    ],
    brandLabel: "THE PARA IDEA",
    brandCycle: "Practice → Assess → Review → Again",
    brandCopy:
      "Our name describes a habit of improvement. The product workflow above keeps teacher guidance at the centre of that habit.",
    details: [
      "A clear practice task, shared by the teacher.",
      "Time to explore the phrase between lessons.",
      "Open a link. Upload an existing audio or video recording.",
      "Useful guidance, in the context of the task.",
      "A next step, then another attempt.",
    ],
  },
  vi: {
    concept: "Minh họa ý tưởng · Sản phẩm đang phát triển",
    comparison:
      "Minh họa các lần thử · Hướng dẫn của giáo viên · Không phải số liệu đo lường",
    play: "Xem hành trình",
    pause: "Tạm dừng",
    next: "Bước tiếp theo",
    storyLabel: "Minh họa vòng học",
    storyStages: [
      "Giao bài",
      "Gửi bản thu",
      "Góp ý của giáo viên",
      "Luyện lại",
    ],
    storyDetails: [
      "Giáo viên gửi một yêu cầu luyện tập rõ ràng.",
      "Học sinh mở link, chọn bản thu âm hoặc video đã có và gửi bài.",
      "Giáo viên góp ý cụ thể cho lần luyện tập.",
      "Học sinh biết mình nên luyện gì tiếp theo và thử lại.",
    ],
    brandLabel: "Ý NGHĨA PARA",
    brandCycle: "Luyện tập → Đánh giá → Xem lại → Thử lại",
    brandCopy:
      "Tên gọi thể hiện thói quen cải thiện. Quy trình sản phẩm phía trên luôn đặt sự hướng dẫn của giáo viên ở vị trí trung tâm.",
    details: [
      "Giáo viên chia sẻ một nhiệm vụ luyện tập rõ ràng.",
      "Luyện tập giữa những buổi học.",
      "Mở link. Gửi bản thu âm hoặc video đã có.",
      "Phản hồi hữu ích gắn với bài luyện tập.",
      "Một bước tiếp theo, rồi một lần thử mới.",
    ],
  },
} as const;

export const audienceSignals = [
  "timestamp-markers",
  "practice-loop",
  "progress-arc",
] as const;

export function conceptCaption(locale: Locale) {
  return paraContent[locale].concept;
}
