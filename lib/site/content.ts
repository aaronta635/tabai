export type Locale = "en" | "vi";

export const locales = ["en", "vi"] as const;

/** This app prefixes both languages. English is /en, Vietnamese is /vi. */
export function localePath(locale: Locale, path: string) {
  if (path === "/") return `/${locale}`;
  return `/${locale}${path}`;
}

export function homeHref(locale: Locale, hash = "") {
  return `${localePath(locale, "/")}${hash}`;
}

export function languageChoiceHref(locale: Locale, path: string, hash = "") {
  return `${localePath(locale, path)}${hash}`;
}

export const content = {
  en: {
    lang: "en",
    navigation: {
      label: "Main navigation",
      homeLabel: "PARA Music, home",
      menu: "Menu",
      close: "Close",
      languageLabel: "Switch to Vietnamese",
      languageShort: "VI",
      items: [
        ["Product", "/product"],
        ["How it works", "/how-it-works"],
        ["Why PARA", "/why-howl0"],
        ["For you", "/for-you"],
        ["People", "/people"],
        ["FAQ", "/faq"],
      ],
    },
    metadata: {
      title: "PARA: See progress between music lessons",
      description:
        "Explore PARA, a music learning platform connecting practice, teacher feedback and progress between lessons.",
    },
    home: {
      metadataTitle: "See progress between music lessons",
      hero: {
        eyebrow: "MUSIC LEARNING, BETWEEN LESSONS",
        title: "See the progress between lessons.",
        intro:
          "PARA is a music learning platform connecting practice, teacher feedback and the next step.",
        primary: "Try for free",
        secondary: "Product direction",
        status: "Available to try at paramuzic.com",
        stages: ["Assign", "Practise", "Submit", "Respond", "Next step"],
        parentView: "Progress update",
        visualMessage: "One learning loop. A clearer view of progress.",
        aria: "Learning loop: assign, practise, submit, respond and take the next step, with a secondary progress update for parents.",
      },
      loop: {
        eyebrow: "THE LEARNING LOOP",
        title: "Every attempt becomes part of the picture.",
        copy: "A teacher sets the direction. A student practises and submits. Feedback shapes the next attempt, while progress stays connected over time.",
        steps: [
          ["01", "Teacher assigns", "Teacher"],
          ["02", "Student practises", "Student"],
          ["03", "Student submits", "Student"],
          ["04", "Teacher responds", "Teacher"],
          ["05", "Learning continues", "Next step"],
        ],
      },
      perspectives: {
        eyebrow: "ONE JOURNEY, THREE PERSPECTIVES",
        title: "Everyone sees what they need to move learning forward.",
        items: [
          {
            name: "Teacher",
            copy: "Keep each attempt connected to useful guidance and the next task.",
          },
          {
            name: "Student",
            copy: "Understand what changed and what to practise next.",
          },
          {
            name: "Parent",
            copy: "See the learning behind the result, with context from the teacher.",
          },
        ],
        link: "See what PARA means for you",
      },
    },
    belief: {
      eyebrow: "OUR BELIEF",
      title: "Feedback is a signal, not a verdict.",
      copy: "One recording never defines a student's ability. It shows where learning is now and where it can go next.",
      labels: [
        "What changed",
        "What to listen for",
        "What to practise next",
        "What to try again",
      ],
    },
    conversion: {
      title: "Your next step starts here.",
      copy: "Explore PARA and bring your music learning together.",
      button: "Try for free",
    },
    product: {
      metadataTitle: "Product",
      eyebrow: "PRODUCT DIRECTION",
      title: "Turn practice into visible progress.",
      intro:
        "PARA is being designed to connect the work students do between lessons with teacher guidance and a clearer progress story for families.",
      visual: "Practice → Feedback → Next step → Progress over time",
      pillars: [
        [
          "01",
          "Capture practice",
          "Keep assignments and audio or video attempts connected.",
        ],
        [
          "02",
          "Guide the next step",
          "Turn teacher feedback into clear actions for the next attempt.",
        ],
        [
          "03",
          "See progress over time",
          "Build an understandable history of effort, feedback and development.",
        ],
      ],
      principle:
        "Technology should carry a teacher's guidance forward, not replace it.",
      principleCopy:
        "PARA is being designed to organise the learning loop. The teacher remains responsible for direction, feedback and judgement.",
      ctaTitle: "Your next step starts here.",
    },
    howItWorks: {
      metadataTitle: "How it works",
      eyebrow: "HOW IT WORKS",
      title: "From one task to a clearer picture of progress.",
      intro:
        "The intended workflow begins with a simple link and connects each attempt to teacher feedback and what happens next.",
      journeyEyebrow: "THE LEARNING LOOP",
      journeyTitle: "Every attempt becomes part of the picture.",
      journeySummary: "Assign → Practise → Submit → Respond → Continue",
      journeyAria: "Learning journey stages",
      steps: [
        ["Assign", "The teacher shares a clear practice task."],
        ["Practise", "The student works on the task between lessons."],
        [
          "Submit",
          "The student opens one link and uploads an existing audio or video recording.",
        ],
        ["Respond", "The teacher adds feedback and a useful next step."],
        [
          "Continue",
          "The student tries again, while authorised parents can follow the progress story.",
        ],
      ],
      teacherTask: "TEACHER TASK",
      audio: "AUDIO",
      video: "VIDEO",
      submitted: "SUBMITTED ✓",
      feedback: "FEEDBACK ↗",
      teacherShare: "TEACHER / ASSIGN",
      studentPractice: "STUDENT / PRACTISE",
      differentiator:
        "Students should not need to learn a platform before they can submit their learning.",
      simpleFlow: "Open link → Choose recording → Submit",
      note: "The submission link is the easy starting point. The connected progress history is the continuing value.",
      ctaTitle: "Your next step starts here.",
    },
    why: {
      metadataTitle: "Why PARA",
      eyebrow: "WHY PARA",
      title: "The most important learning is often the hardest to see.",
      intro:
        "Lessons show a moment. Results show an outcome. The practice, feedback and small improvements between them often remain scattered or invisible.",
      missingTitle: "Parents often see the performance, not the process.",
      missingCopy:
        "PARA is exploring a clearer way for families to understand effort, feedback and development, led by teachers and without turning learning into surveillance.",
      fragments: [
        "Practice task",
        "Student recording",
        "Teacher feedback",
        "Next step",
        "Effort",
        "Progress over time",
      ],
      scatterAria:
        "Practice tasks, student recordings, teacher feedback and next steps connect into a learning loop.",
      ctaTitle: "Your next step starts here.",
    },
    forYou: {
      metadataTitle: "For you",
      eyebrow: "BUILT AROUND THE LEARNING RELATIONSHIP",
      title: "One journey, with a clearer role for everyone.",
      intro:
        "Students, teachers and parents do not need the same experience. PARA is being shaped around what each person needs from the learning loop.",
      tabsLabel: "Audience perspectives",
      views: [
        {
          name: "Teacher",
          title: "Guide progress without losing the thread.",
          copy: "Keep assignments, attempts, feedback and next steps connected, so less time is spent searching and more attention stays on teaching.",
          benefits: [
            "Work in context",
            "Feedback that carries forward",
            "A clearer learning history",
          ],
        },
        {
          name: "Student",
          title: "Know what to try next.",
          copy: "Submit practice without unnecessary steps, understand the feedback and see how each attempt contributes to progress.",
          benefits: [
            "Easy submission",
            "Clear next steps",
            "Progress without judgement",
          ],
        },
        {
          name: "Parent",
          title: "See the learning behind the result.",
          copy: "Follow an authorised view of effort and progress, guided by the teacher, so you can support the learner without needing to manage every practice session.",
          benefits: [
            "Useful context",
            "Visible development",
            "More informed support",
          ],
        },
      ],
      ctaTitle: "Your next step starts here.",
    },
    people: {
      metadataTitle: "People",
      eyebrow: "THE PEOPLE BEHIND PARA",
      title: "Meet Henry and Aaron.",
      intro:
        "Henry Nguyen and Aaron Ta are creating PARA together, with a shared focus on the learning that happens between music lessons.",
      profiles: [
        {
          name: "Henry Nguyen",
          role: "Commercial Cofounder",
          description:
            "The bassist and business mind behind PARA. Henry brings a musician's perspective to shaping how PARA connects with teachers, students and families.",
        },
        {
          name: "Aaron Ta",
          role: "Founder",
          description:
            "The guitarist and tech mind behind PARA. Aaron brings a musician's perspective to building the technology that connects practice, feedback and the next step.",
        },
      ],
      whyEyebrow: "WHY WE'RE BUILDING PARA",
      whyTitle: "Learning does not stop when a lesson ends.",
      whyCopy:
        "We are building PARA to help teachers, students and families understand the work between lessons, starting with one simple way to submit practice and keeping the next step in view.",
      ctaTitle: "Your next step starts here.",
    },
    faq: {
      metadataTitle: "FAQ",
      eyebrow: "GOOD QUESTIONS",
      title: "Your questions about PARA.",
      note: "PARA is available to try at paramuzic.com. Some ideas described here are still being explored.",
      items: [
        [
          "What is PARA?",
          "PARA is a music learning platform focused on practice, teacher feedback and the next step between lessons.",
        ],
        [
          "Who is PARA for?",
          "PARA is being designed for independent music teachers, their students and authorised parents or guardians.",
        ],
        [
          "Is PARA available now?",
          "Yes. Visit paramuzic.com to try PARA for free.",
        ],
        [
          "How will students submit practice?",
          "The intended experience begins with a simple link. A student opens it in a browser, selects an existing audio or video recording and submits it to the appropriate teacher and task.",
        ],
        [
          "What will parents be able to see?",
          "We are exploring an authorised view of practice activity, teacher feedback and progress over time, appropriate to the learner's age. The exact information and controls still require research with families, students and teachers.",
        ],
        [
          "Does PARA replace the teacher?",
          "No. The teacher remains responsible for learning direction, feedback and professional judgement. Technology should help that guidance continue between lessons.",
        ],
        [
          "Will students need to download an app?",
          "The planned submission experience runs in a browser, so students should be able to begin from a link. Final platform and device requirements remain subject to development and testing.",
        ],
        [
          "How much will PARA cost?",
          "Visit PARA for current product and pricing information.",
        ],
        [
          "Can I try PARA for free?",
          "Yes. Visit paramuzic.com to try PARA for free.",
        ],
      ],
    },
    footer: {
      belief: "Feedback is a signal, not a verdict.",
      status: "Available to try",
      pronunciation: "Music learning, made visible",
      contact: "Contact details coming soon",
      navigationLabel: "Footer navigation",
    },
    skip: "Skip to content",
  },
  vi: {
    lang: "vi",
    navigation: {
      label: "Điều hướng chính",
      homeLabel: "PARA Music, trang chủ",
      menu: "Trình đơn",
      close: "Đóng",
      languageLabel: "Chuyển sang tiếng Anh",
      languageShort: "EN",
      items: [
        ["Sản phẩm", "/product"],
        ["Cách hoạt động", "/how-it-works"],
        ["Vì sao PARA", "/why-howl0"],
        ["Dành cho bạn", "/for-you"],
        ["Con người", "/people"],
        ["Câu hỏi thường gặp", "/faq"],
      ],
    },
    metadata: {
      title: "PARA: Nhìn thấy tiến bộ giữa những buổi học nhạc",
      description:
        "Khám phá PARA, nền tảng học nhạc kết nối luyện tập, góp ý của giáo viên và hành trình tiến bộ giữa các buổi học.",
    },
    home: {
      metadataTitle: "Nhìn thấy tiến bộ giữa những buổi học nhạc",
      hero: {
        eyebrow: "HỌC NHẠC, CẢ GIỮA NHỮNG BUỔI HỌC",
        title: "Thấy từng bước tiến giữa những buổi học.",
        intro:
          "PARA là nền tảng học nhạc kết nối luyện tập, góp ý của giáo viên và bước tiếp theo.",
        primary: "Dùng thử miễn phí",
        secondary: "Định hướng sản phẩm",
        status: "Trải nghiệm tại paramuzic.com",
        stages: ["Giao bài", "Luyện tập", "Gửi bài", "Góp ý", "Bước tiếp theo"],
        parentView: "Cập nhật tiến bộ",
        visualMessage: "Một vòng học liền mạch. Tiến bộ được nhìn thấy rõ hơn.",
        aria: "Vòng học gồm giao bài, luyện tập, gửi bài, góp ý và bước tiếp theo, cùng một góc nhìn cập nhật tiến bộ dành cho phụ huynh.",
      },
      loop: {
        eyebrow: "VÒNG HỌC LIÊN TỤC",
        title: "Mỗi lần luyện tập đều cho thấy một bước tiến.",
        copy: "Giáo viên định hướng. Học sinh luyện tập và gửi bài. Góp ý trở thành bước khởi đầu cho lần thử tiếp theo, còn cả quá trình được lưu lại liền mạch.",
        steps: [
          ["01", "Giáo viên giao bài", "Giáo viên"],
          ["02", "Học sinh luyện tập", "Học sinh"],
          ["03", "Gửi bài", "Học sinh"],
          ["04", "Giáo viên góp ý", "Giáo viên"],
          ["05", "Tiếp tục tiến bộ", "Bước tiếp theo"],
        ],
      },
      perspectives: {
        eyebrow: "MỘT HÀNH TRÌNH, BA GÓC NHÌN",
        title:
          "Mỗi người thấy đúng điều mình cần để cùng đưa việc học tiến về phía trước.",
        items: [
          {
            name: "Giáo viên",
            copy: "Kết nối từng lần luyện tập với góp ý hữu ích và bài học tiếp theo.",
          },
          {
            name: "Học sinh",
            copy: "Hiểu mình đã thay đổi điều gì và cần luyện gì tiếp theo.",
          },
          {
            name: "Phụ huynh",
            copy: "Hiểu quá trình phía sau kết quả, qua những cập nhật có định hướng từ giáo viên.",
          },
        ],
        link: "Xem PARA dành cho bạn",
      },
    },
    belief: {
      eyebrow: "ĐIỀU PARA TIN TƯỞNG",
      title: "Góp ý là tín hiệu để tiến bộ, không phải lời phán xét.",
      copy: "Một bản thu không thể định nghĩa năng lực của học sinh. Nó chỉ cho thấy hành trình đang ở đâu và bước tiếp theo có thể là gì.",
      labels: [
        "Điều đã thay đổi",
        "Điều cần lắng nghe",
        "Điều cần luyện tiếp",
        "Điều nên thử lại",
      ],
    },
    conversion: {
      title: "Bắt đầu bước tiếp theo cùng PARA.",
      copy: "Khám phá PARA và kết nối hành trình học nhạc của bạn.",
      button: "Dùng thử miễn phí",
    },
    product: {
      metadataTitle: "Sản phẩm",
      eyebrow: "ĐỊNH HƯỚNG SẢN PHẨM",
      title: "Để mỗi lần luyện tập trở thành một bước tiến có thể nhìn thấy.",
      intro:
        "PARA đang được thiết kế để kết nối phần luyện tập giữa các buổi học với định hướng của giáo viên và giúp gia đình hiểu rõ hơn hành trình tiến bộ.",
      visual: "Luyện tập → Góp ý → Bước tiếp theo → Tiến bộ theo thời gian",
      pillars: [
        [
          "01",
          "Luyện tập",
          "Kết nối bài tập với từng bản thu âm hoặc video luyện tập.",
        ],
        [
          "02",
          "Góp ý",
          "Biến góp ý của giáo viên thành những việc cụ thể cho lần luyện tiếp theo.",
        ],
        [
          "03",
          "Tiến bộ theo thời gian",
          "Tạo nên một hành trình dễ hiểu về nỗ lực, góp ý và sự tiến bộ theo thời gian.",
        ],
      ],
      principle:
        "Công nghệ nên giúp định hướng của giáo viên đi xa hơn, không thay thế giáo viên.",
      principleCopy:
        "PARA đang được thiết kế để giúp vòng học trở nên liền mạch. Giáo viên vẫn là người định hướng, góp ý và đưa ra đánh giá chuyên môn.",
      ctaTitle: "Bắt đầu bước tiếp theo cùng PARA.",
    },
    howItWorks: {
      metadataTitle: "Cách hoạt động",
      eyebrow: "CÁCH HOẠT ĐỘNG",
      title: "Từ một bài tập đến một hành trình tiến bộ rõ ràng hơn.",
      intro:
        "Quy trình dự kiến bắt đầu bằng một đường link đơn giản, kết nối từng lần luyện tập với góp ý của giáo viên và bước tiếp theo.",
      journeyEyebrow: "VÒNG HỌC LIÊN TỤC",
      journeyTitle: "Mỗi lần luyện tập đều cho thấy một bước tiến.",
      journeySummary: "Giao bài → Luyện tập → Gửi bài → Góp ý → Tiếp tục",
      journeyAria: "Các bước trong hành trình học tập",
      steps: [
        ["Giao bài", "Giáo viên gửi một yêu cầu luyện tập rõ ràng."],
        [
          "Luyện tập",
          "Học sinh luyện bài trong khoảng thời gian giữa hai buổi học.",
        ],
        [
          "Gửi bài",
          "Học sinh mở một đường link và gửi bản thu âm hoặc video đã có.",
        ],
        ["Góp ý", "Giáo viên phản hồi và đưa ra bước luyện tập tiếp theo."],
        [
          "Tiếp tục",
          "Học sinh thử lại, còn phụ huynh được cấp quyền có thể theo dõi hành trình tiến bộ.",
        ],
      ],
      teacherTask: "BÀI TẬP",
      audio: "ÂM THANH",
      video: "VIDEO",
      submitted: "ĐÃ GỬI ✓",
      feedback: "GÓP Ý ↗",
      teacherShare: "GIÁO VIÊN / GIAO BÀI",
      studentPractice: "HỌC SINH / LUYỆN TẬP",
      differentiator:
        "Học sinh không nên phải học cách dùng một nền tảng trước khi có thể gửi bài.",
      simpleFlow: "Mở link → Chọn bản thu → Gửi bài",
      note: "Đường link giúp việc bắt đầu thật đơn giản. Hành trình tiến bộ được kết nối mới là giá trị lâu dài.",
      ctaTitle: "Bắt đầu bước tiếp theo cùng PARA.",
    },
    why: {
      metadataTitle: "Vì sao PARA",
      eyebrow: "VÌ SAO CÓ PARA",
      title:
        "Phần quan trọng nhất của việc học đôi khi lại khó nhìn thấy nhất.",
      intro:
        "Buổi học cho thấy một thời điểm. Kết quả cho thấy đích đến. Nhưng những lần luyện tập, góp ý và tiến bộ nhỏ ở giữa thường rời rạc hoặc bị bỏ qua.",
      missingTitle:
        "Phụ huynh thường thấy phần trình diễn, nhưng chưa chắc thấy được cả quá trình.",
      missingCopy:
        "PARA đang tìm cách giúp gia đình hiểu rõ hơn về nỗ lực, góp ý và sự tiến bộ dưới sự định hướng của giáo viên, chứ không biến việc học thành sự giám sát.",
      fragments: [
        "Bài tập",
        "Bản thu của học sinh",
        "Góp ý của giáo viên",
        "Bước tiếp theo",
        "Nỗ lực",
        "Tiến bộ theo thời gian",
      ],
      scatterAria:
        "Bài tập, bản thu của học sinh, góp ý của giáo viên và bước tiếp theo kết nối thành một vòng học.",
      ctaTitle: "Bắt đầu bước tiếp theo cùng PARA.",
    },
    forYou: {
      metadataTitle: "Dành cho bạn",
      eyebrow: "ĐƯỢC XÂY DỰNG QUANH MỐI QUAN HỆ HỌC TẬP",
      title: "Một hành trình, với vai trò rõ ràng hơn cho mỗi người.",
      intro:
        "Học sinh, giáo viên và phụ huynh không cần cùng một trải nghiệm. PARA đang được xây dựng dựa trên điều mỗi người thực sự cần trong vòng học.",
      tabsLabel: "Góc nhìn của từng người",
      views: [
        {
          name: "Giáo viên",
          title: "Theo sát tiến bộ mà không để hành trình bị đứt đoạn.",
          copy: "Kết nối bài tập, từng lần luyện, góp ý và bước tiếp theo để giảm thời gian tìm kiếm và dành nhiều sự tập trung hơn cho việc dạy.",
          benefits: [
            "Bài làm đúng ngữ cảnh",
            "Góp ý được tiếp nối",
            "Hành trình học rõ ràng hơn",
          ],
        },
        {
          name: "Học sinh",
          title: "Biết mình nên thử điều gì tiếp theo.",
          copy: "Gửi bài luyện tập thật đơn giản, hiểu góp ý của giáo viên và thấy mỗi lần thử đang đưa mình tiến về phía trước như thế nào.",
          benefits: [
            "Gửi bài dễ dàng",
            "Bước tiếp theo rõ ràng",
            "Tiến bộ không áp lực phán xét",
          ],
        },
        {
          name: "Phụ huynh",
          title: "Hiểu quá trình phía sau kết quả.",
          copy: "Theo dõi hành trình nỗ lực và tiến bộ được giáo viên định hướng, để đồng hành cùng con mà không cần quản lý từng buổi luyện tập.",
          benefits: [
            "Thông tin đúng ngữ cảnh",
            "Tiến bộ dễ nhận ra",
            "Đồng hành đúng cách hơn",
          ],
        },
      ],
      ctaTitle: "Bắt đầu bước tiếp theo cùng PARA.",
    },
    people: {
      metadataTitle: "Con người",
      eyebrow: "NHỮNG NGƯỜI ĐỨNG SAU PARA",
      title: "Gặp gỡ Henry và Aaron.",
      intro:
        "Henry Nguyen và Aaron Ta đang cùng xây dựng PARA, với mong muốn kết nối rõ hơn việc học nhạc giữa các buổi học.",
      profiles: [
        {
          name: "Henry Nguyen",
          role: "Đồng sáng lập phụ trách thương mại",
          description:
            "Henry chơi bass và phụ trách hướng kinh doanh của PARA. Từ góc nhìn của người chơi nhạc, Henry cùng xây dựng cách PARA kết nối với giáo viên, học sinh và gia đình.",
        },
        {
          name: "Aaron Ta",
          role: "Người sáng lập",
          description:
            "Aaron chơi guitar và phụ trách hướng công nghệ của PARA. Từ góc nhìn của người chơi nhạc, Aaron xây dựng công nghệ để kết nối luyện tập, góp ý và bước tiếp theo.",
        },
      ],
      whyEyebrow: "VÌ SAO CHÚNG TÔI XÂY DỰNG PARA",
      whyTitle: "Việc học không dừng lại khi buổi học kết thúc.",
      whyCopy:
        "Chúng tôi xây dựng PARA để giáo viên, học sinh và gia đình hiểu rõ hơn việc học giữa các buổi học, bắt đầu từ một cách gửi bài đơn giản và giữ cho bước tiếp theo luôn rõ ràng.",
      ctaTitle: "Bắt đầu bước tiếp theo cùng PARA.",
    },
    faq: {
      metadataTitle: "Câu hỏi thường gặp",
      eyebrow: "NHỮNG CÂU HỎI ĐÁNG ĐƯỢC TRẢ LỜI",
      title: "Những câu hỏi của bạn về PARA.",
      note: "Bạn có thể trải nghiệm PARA tại paramuzic.com. Một số ý tưởng được mô tả ở đây vẫn đang được tìm hiểu.",
      items: [
        [
          "PARA là gì?",
          "PARA là nền tảng học nhạc tập trung vào luyện tập, góp ý của giáo viên và bước tiếp theo giữa các buổi học.",
        ],
        [
          "PARA dành cho ai?",
          "PARA đang được thiết kế cho giáo viên âm nhạc độc lập, học sinh và phụ huynh hoặc người giám hộ được cấp quyền.",
        ],
        [
          "PARA đã có thể sử dụng chưa?",
          "Có. Truy cập paramuzic.com để dùng thử PARA miễn phí.",
        ],
        [
          "Học sinh sẽ gửi bài luyện tập như thế nào?",
          "Trải nghiệm dự kiến bắt đầu bằng một đường link đơn giản. Học sinh mở link trên trình duyệt, chọn bản thu âm hoặc video đã có và gửi đúng cho giáo viên cùng bài tập tương ứng.",
        ],
        [
          "Phụ huynh sẽ có thể xem những gì?",
          "Chúng tôi đang nghiên cứu một góc nhìn phù hợp với độ tuổi và chỉ dành cho người được cấp quyền, bao gồm hoạt động luyện tập, góp ý của giáo viên và tiến bộ theo thời gian. Nội dung và quyền kiểm soát cụ thể vẫn cần được kiểm chứng cùng gia đình, học sinh và giáo viên.",
        ],
        [
          "PARA có thay thế giáo viên không?",
          "Không. Giáo viên vẫn là người chịu trách nhiệm định hướng, góp ý và đưa ra đánh giá chuyên môn. Công nghệ chỉ giúp sự hướng dẫn ấy được tiếp nối giữa các buổi học.",
        ],
        [
          "Học sinh có cần tải ứng dụng không?",
          "Trải nghiệm gửi bài dự kiến hoạt động trên trình duyệt, để học sinh có thể bắt đầu ngay từ một đường link. Yêu cầu chính thức về nền tảng và thiết bị sẽ được xác định sau quá trình phát triển và thử nghiệm.",
        ],
        [
          "PARA sẽ có mức giá bao nhiêu?",
          "Truy cập PARA để xem thông tin sản phẩm và giá hiện tại.",
        ],
        [
          "Tôi có thể dùng thử PARA miễn phí không?",
          "Có. Truy cập paramuzic.com để dùng thử PARA miễn phí.",
        ],
      ],
    },
    footer: {
      belief: "Góp ý là tín hiệu để tiến bộ, không phải lời phán xét.",
      status: "Đã có thể trải nghiệm",
      pronunciation: "Để tiến bộ được nhìn thấy",
      contact: "Thông tin liên hệ sẽ sớm được cập nhật",
      navigationLabel: "Điều hướng cuối trang",
    },
    skip: "Bỏ qua để đến nội dung chính",
  },
} as const;

export type SiteContent = (typeof content)[Locale];

export function getContent(locale: Locale): SiteContent {
  return content[locale] as SiteContent;
}
