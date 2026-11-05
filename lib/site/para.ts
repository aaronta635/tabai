import type { Locale } from "@/lib/site/content";

// Additions from the PARA resource pack. Existing dictionaries remain the source
// for the product story, audience roles, FAQ and development qualifications.
export const paraContent = {
  en: {
    concept: "Illustrative learning workflow",
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
    concept: "Minh họa cách giao bài và góp ý",
    comparison:
      "Minh họa các lần tập · Góp ý của giáo viên · Không phải điểm số",
    play: "Xem lần tập",
    pause: "Tạm dừng",
    next: "Lần tập sau",
    storyLabel: "Minh họa cách giao bài và góp ý",
    storyStages: [
      "Giao bài",
      "Gửi bản thu",
      "Góp ý của giáo viên",
      "Luyện lại",
    ],
    storyDetails: [
      "Giáo viên giao một bài tập rõ.",
      "Học viên mở link, chọn bản thu âm hoặc video đã có và gửi bài.",
      "Giáo viên góp ý đúng chỗ lần tập đó cần sửa.",
      "Học viên biết chỗ cần tập lại rồi thu lần nữa.",
    ],
    brandLabel: "Ý NGHĨA PARA",
    brandCycle: "Luyện tập → Nghe lại → Góp ý → Tập lại",
    brandCopy:
      "PARA để tập, nghe, sửa, rồi tập lại. Giáo viên vẫn là người giao bài và góp ý.",
    details: [
      "Giáo viên giao một bài tập rõ.",
      "Học viên tập ở nhà, giữa hai buổi học.",
      "Mở link. Gửi bản thu âm hoặc video đã có.",
      "Góp ý gắn với đúng bài đó.",
      "Học viên biết chỗ cần sửa, rồi tập lại.",
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
