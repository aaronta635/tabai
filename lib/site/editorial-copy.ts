import type { Locale } from "@/lib/site/content";

/**
 * Copy for the editorial homepage (/en and /vi). Navigation, the CTA label and
 * the footer legal links come from `content` in lib/site/content.ts; everything
 * else on the editorial home lives here.
 *
 * VI: DRAFT for Aaron's review (written for Vietnamese teachers and parents of
 * music students). Keep keys in sync between en and vi.
 */
export type EditorialDemo = {
  id: "take" | "feedback" | "next";
  eyebrow: string;
  /** Heading lines; the second line (if any) is wrapped so it can sit on its own line. */
  titleLines: string[];
  copy: string;
  /** Screen-reader description of the demo video. */
  description: string;
  caption: string;
};

export type EditorialCopy = {
  metaDescription: string;
  nav: { howItWorks: string };
  hero: { titleLead: string; titleFocus: string; titleTail: string; intro: string };
  showcase: { label: string; demos: EditorialDemo[] };
  demo: {
    exampleLabel: string;
    videoLabelSuffix: string;
    play: string;
    pause: string;
    playbackPaused: string;
    loadError: string;
    /** Link text in the no-JavaScript fallback, e.g. "Watch Your take. demo". */
    watchPrefix: string;
    watchSuffix: string;
  };
  belief: { lead: string; signal: string; tail: string };
  close: { title: string };
  footer: { explore: string };
};

const en: EditorialCopy = {
  metaDescription:
    "Share a practice take, hear from your teacher, and know what to try next with PARA Music.",
  nav: { howItWorks: "How it works" },
  hero: {
    titleLead: "See the",
    titleFocus: "progress",
    titleTail: "between lessons.",
    intro: "Share a practice take, hear from your teacher, and know what to try next.",
  },
  showcase: {
    label: "How it works",
    demos: [
      {
        id: "take",
        eyebrow: "01 / Submit",
        titleLines: ["Your take."],
        copy: "Send your teacher a recording of the passage you’ve been practising.",
        description:
          "The student chooses chord-study-take-01.mp4, sends the recording and sees Submitted. The recording is sent to the teacher.",
        caption: "chord-study-take-01.mp4 · Submitted",
      },
      {
        id: "feedback",
        eyebrow: "02 / Feedback",
        titleLines: ["Your", "teacher’s note."],
        copy: "See what your teacher heard, right where it happened.",
        description:
          "The teacher selects 0:24 in the recording and adds: Keep the pulse steady through the chord change. The comment and recording both show the same timestamp.",
        caption: "0:24 · Teacher: “Keep the pulse steady through the chord change.”",
      },
      {
        id: "next",
        eyebrow: "03 / Practise",
        titleLines: ["Your next try."],
        copy: "Take one clear practice step into your next recording.",
        description:
          "The student sees the teacher’s note at 0:24 and the next steps: Replay the change at 0:24. Practise the change slowly, keeping the pulse. Record the same passage again.",
        caption: "Next practice: “Practise the change slowly, keeping the pulse.”",
      },
    ],
  },
  demo: {
    exampleLabel: "Example · Concept demo",
    videoLabelSuffix: "Example concept demo",
    play: "Play demo",
    pause: "Pause demo",
    playbackPaused: "Playback paused. Select Play demo to try again.",
    loadError: "This demo could not load. Please try again.",
    watchPrefix: "Watch",
    watchSuffix: "demo",
  },
  belief: { lead: "Feedback is a", signal: "signal,", tail: "not a verdict." },
  close: { title: "Hear it. Understand it. Play again." },
  footer: { explore: "Explore PARA" },
};

/** DRAFT: Vietnamese copy for Aaron's review. */
const vi: EditorialCopy = {
  metaDescription:
    "Gửi bài tập, nhận góp ý từ thầy cô và biết rõ cần tập gì tiếp theo cùng PARA Music.",
  nav: { howItWorks: "Cách hoạt động" },
  hero: {
    titleLead: "Thấy rõ",
    titleFocus: "tiến bộ",
    titleTail: "giữa các buổi học.",
    intro: "Gửi bài tập, nghe thầy cô góp ý và biết rõ cần tập gì tiếp theo.",
  },
  showcase: {
    label: "Cách hoạt động",
    demos: [
      {
        id: "take",
        eyebrow: "01 / Gửi bài",
        titleLines: ["Bài tập của bạn."],
        copy: "Gửi cho thầy cô bản thu đoạn nhạc bạn đang luyện.",
        description:
          "Học viên chọn tệp chord-study-take-01.mp4, gửi bản thu và thấy trạng thái Đã gửi. Bản thu được chuyển đến giáo viên.",
        caption: "chord-study-take-01.mp4 · Đã gửi",
      },
      {
        id: "feedback",
        eyebrow: "02 / Góp ý",
        titleLines: ["Lời nhắn", "của thầy cô."],
        copy: "Xem thầy cô nghe thấy gì, ngay tại đúng chỗ đó trong bản thu.",
        description:
          "Giáo viên chọn mốc 0:24 trong bản thu và ghi: Giữ nhịp đều khi chuyển hợp âm. Lời nhắn và bản thu cùng hiển thị một mốc thời gian.",
        caption: "0:24 · Giáo viên: “Giữ nhịp đều khi chuyển hợp âm.”",
      },
      {
        id: "next",
        eyebrow: "03 / Luyện tập",
        titleLines: ["Lần tập tiếp theo."],
        copy: "Mang một bước luyện tập rõ ràng vào lần thu tiếp theo.",
        description:
          "Học viên xem lời nhắn của giáo viên ở mốc 0:24 và các bước tiếp theo: Nghe lại đoạn chuyển ở 0:24. Tập chậm đoạn chuyển, giữ nhịp đều. Thu lại đúng đoạn đó.",
        caption: "Bài tập tiếp theo: “Tập chậm đoạn chuyển hợp âm, giữ nhịp đều.”",
      },
    ],
  },
  demo: {
    exampleLabel: "Ví dụ · Bản demo minh họa",
    videoLabelSuffix: "Bản demo minh họa",
    play: "Phát demo",
    pause: "Tạm dừng demo",
    playbackPaused: "Demo đã tạm dừng. Chọn Phát demo để thử lại.",
    loadError: "Không tải được bản demo này. Vui lòng thử lại.",
    watchPrefix: "Xem demo",
    watchSuffix: "",
  },
  belief: { lead: "Góp ý là một", signal: "tín hiệu,", tail: "không phải lời phán xét." },
  close: { title: "Nghe. Hiểu. Chơi lại." },
  footer: { explore: "Khám phá PARA" },
};

export const editorialCopy: Record<Locale, EditorialCopy> = { en, vi };
