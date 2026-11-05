import type { Locale } from "@/lib/site/content";

/** This brief's concise scene copy; technical VI labels are documented in handoff. */
export const studio = {
  en: {
    heroLines: ["See the progress", "between lessons."],
    platform:
      "PARA is a music learning platform connecting practice, teacher feedback and the next step.",
    discover: "Explore PARA",
    concept: "Illustrative learning workflow",
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
    session: {
      passage: "One practice passage",
      guidance: "Keep the pulse steady through this phrase.",
      practice: "Practise this passage slowly, then try another recording.",
      progress: "Working on a steadier pulse in this passage.",
      support: "Ask what their teacher suggested trying next.",
      supportLabel: "Support practice",
    },
    beliefLines: ["Feedback is a signal,", "not a verdict."],
    beliefCopy: "Every attempt helps reveal the next step.",
    openLoop: "An open loop, ready for what comes next.",
  },
  vi: {
    heroLines: ["Thầy nghe được", "bài tập ở nhà."],
    platform:
      "PARA giúp giáo viên giao bài, nghe bài học viên gửi và hướng dẫn chỗ cần sửa giữa hai buổi học.",
    discover: "Xem PARA làm gì",
    concept: "Minh họa cách giao bài và góp ý",
    assignment: "Link giao bài",
    recording: "Bản thu âm / video đã có",
    feedback: "Góp ý của giáo viên",
    nextPractice: "Chỗ cần sửa lần sau",
    pause: "Tạm dừng",
    resume: "Chạy tiếp",
    next: "Phần sau",
    loopLines: ["Một lần tập.", "Một chỗ cần sửa."],
    loopIntro: "Một link gửi bài. Bài, bản thu và góp ý nằm cùng một chỗ.",
    steps: [
      "Giáo viên giao bài rõ.",
      "Học viên tập ở nhà, giữa hai buổi học.",
      "Gửi bản thu âm hoặc video đã có.",
      "Giáo viên chỉ chỗ cần sửa.",
      "Học viên biết chỗ cần sửa rồi tập lại.",
    ],
    loopNote: "Hình minh họa, không phải chỗ gửi hay nghe bản thu.",
    instruction: "Nghe. Sửa. Tập lại.",
    continue: "Lần tập sau",
    listen: "Nghe chỗ đã khác",
    perspectivesLines: ["Ba người.", "Ba việc khác nhau."],
    perspectives: [
      "Bài làm và góp ý của bạn nằm cùng một chỗ.",
      "Biết chỗ cần tập lại.",
      "Biết con đang tập gì giữa hai buổi học.",
    ],
    parentNote:
      "Phụ huynh được cho xem thì thấy bài con tập và góp ý của giáo viên. Phần này vẫn đang làm.",
    session: {
      passage: "Cùng một đoạn luyện tập",
      guidance: "Giữ nhịp đều trong đoạn này.",
      practice: "Luyện chậm đoạn này, rồi thu lại.",
      progress: "Đang luyện giữ nhịp đều hơn trong đoạn này.",
      support: "Hỏi xem thầy bảo con sửa chỗ nào.",
      supportLabel: "Phụ huynh xem cùng",
    },
    beliefLines: ["Góp ý để sửa,", "không phải để chấm."],
    beliefCopy: "Giáo viên nghe lần tập này và chỉ chỗ cần sửa lần sau.",
    openLoop: "Còn bài để tập lại.",
  },
} as const;

export function sceneCopy(locale: Locale) {
  return studio[locale];
}
