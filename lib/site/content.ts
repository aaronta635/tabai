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
      contact: "info@paramuzic.com",
      navigationLabel: "Footer navigation",
      legalLabel: "Legal",
      legal: [
        ["Privacy", "/privacy"],
        ["Terms", "/terms"],
        ["Delete your data", "/data-deletion"],
      ],
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
      title: "PARA: Việc tập ở nhà không bị ngắt sau buổi học",
      description:
        "Phần lớn thời gian là tự tập ở nhà. PARA giúp giáo viên giao bài, nghe bài học viên gửi và hướng dẫn chỗ cần sửa giữa hai buổi học.",
    },
    home: {
      metadataTitle: "Việc tập ở nhà không bị ngắt sau buổi học",
      hero: {
        eyebrow: "TỰ TẬP Ở NHÀ, GIỮA HAI BUỔI HỌC",
        title: "Thầy nghe được bài học viên tập ở nhà.",
        intro:
          "Phần lớn thời gian là tự tập ở nhà. PARA giúp giáo viên giao bài, nghe bài học viên gửi và hướng dẫn chỗ cần sửa giữa hai buổi học.",
        primary: "Dùng thử miễn phí",
        secondary: "Xem PARA làm gì",
        status: "Dùng thử tại paramuzic.com",
        stages: ["Giao bài", "Luyện tập", "Gửi bài", "Góp ý", "Luyện lại"],
        parentView: "Phụ huynh xem bài của con",
        visualMessage: "Giao bài, gửi bài, góp ý. Cùng một chỗ.",
        aria: "Giáo viên giao bài. Học viên luyện và gửi bài. Giáo viên góp ý chỗ cần sửa. Phụ huynh xem con đã tập gì.",
      },
      loop: {
        eyebrow: "GIỮA HAI BUỔI HỌC",
        title: "Mỗi lần tập, giáo viên đều nghe và góp ý.",
        copy: "Giáo viên giao bài. Học viên tập ở nhà rồi gửi bài. Giáo viên nghe và chỉ chỗ cần sửa. Bài, bản thu và góp ý được lưu lại.",
        steps: [
          ["01", "Giáo viên giao bài", "Giáo viên"],
          ["02", "Học viên tập ở nhà", "Học viên"],
          ["03", "Học viên gửi bài", "Học viên"],
          ["04", "Giáo viên góp ý", "Giáo viên"],
          ["05", "Học viên luyện lại", "Luyện lại"],
        ],
      },
      perspectives: {
        eyebrow: "GIÁO VIÊN, HỌC VIÊN, PHỤ HUYNH",
        title: "Mỗi người làm một việc khác nhau.",
        items: [
          {
            name: "Giáo viên",
            copy: "Giao bài, nghe bài học viên gửi, chỉ chỗ cần sửa.",
          },
          {
            name: "Học viên",
            copy: "Biết mình đang sai chỗ nào và cần tập gì.",
          },
          {
            name: "Phụ huynh",
            copy: "Biết con đang tập gì, thầy đã góp ý gì, con khá hơn chưa.",
          },
        ],
        link: "Xem PARA dành cho bạn",
      },
    },
    belief: {
      eyebrow: "GÓP Ý",
      title: "Góp ý để sửa, không phải để chấm một lần thu.",
      copy: "Một bản thu không nói hết học viên chơi được đến đâu. Nó cho thấy chỗ đang đúng, chỗ còn sai, và lần tập sau cần sửa gì.",
      labels: [
        "Chỗ đã khá hơn",
        "Chỗ cần nghe lại",
        "Chỗ cần luyện",
        "Chỗ nên thu lại",
      ],
    },
    conversion: {
      title: "Giao bài và nghe bài tập ở nhà, trên PARA.",
      copy: "Giáo viên giao bài. Học viên gửi bài. Thầy góp ý chỗ cần sửa.",
      button: "Dùng thử miễn phí",
    },
    product: {
      metadataTitle: "Sản phẩm",
      eyebrow: "PARA LÀM GÌ",
      title: "Giáo viên nghe lại được mỗi lần tập ở nhà.",
      intro:
        "Phần lớn thời gian là tự tập ở nhà. PARA giúp giáo viên giao bài, nghe bài học viên gửi và hướng dẫn chỗ cần sửa giữa hai buổi học.",
      visual: "Luyện tập → Góp ý → Luyện lại → Khá hơn theo thời gian",
      pillars: [
        [
          "01",
          "Luyện tập",
          "Bài giáo viên giao và bản thu của học viên nằm cùng một chỗ.",
        ],
        [
          "02",
          "Góp ý",
          "Giáo viên nghe bài và chỉ đúng chỗ học viên cần sửa lần sau.",
        ],
        [
          "03",
          "Khá hơn theo thời gian",
          "Xem lại bài đã giao, lần đã tập, và góp ý trước đó.",
        ],
      ],
      principle:
        "PARA giữ lời thầy giữa hai buổi học, không thay thầy.",
      principleCopy:
        "PARA giữ bài, bản thu và góp ý cùng một chỗ. Giáo viên vẫn là người giao bài, nghe bài và chỉ chỗ cần sửa.",
      ctaTitle: "Thử giao bài trên PARA.",
    },
    howItWorks: {
      metadataTitle: "Cách hoạt động",
      eyebrow: "CÁCH HOẠT ĐỘNG",
      title: "Giao bài, gửi bài, góp ý. Đơn giản.",
      intro:
        "PARA được làm để việc giao bài, gửi bài và góp ý giữa hai buổi học thật đơn giản.",
      journeyEyebrow: "TỪ BÀI GIAO ĐẾN LẦN TẬP SAU",
      journeyTitle: "Mỗi lần tập, giáo viên đều nghe và góp ý.",
      journeySummary: "Giao bài → Luyện tập → Gửi bài → Góp ý → Luyện lại",
      journeyAria:
        "Giáo viên giao bài, học viên luyện và gửi, giáo viên góp ý, học viên luyện lại",
      steps: [
        ["Giao bài", "Giáo viên giao một bài tập rõ."],
        ["Luyện tập", "Học viên tập bài đó ở nhà, giữa hai buổi học."],
        [
          "Gửi bài",
          "Học viên mở link, chọn bản thu âm hoặc video đã có, rồi gửi.",
        ],
        ["Góp ý", "Giáo viên nghe và chỉ chỗ cần sửa."],
        [
          "Luyện lại",
          "Học viên tập lại. Phụ huynh được cho xem thì thấy con đã tập gì và thầy đã góp ý gì.",
        ],
      ],
      teacherTask: "BÀI TẬP",
      audio: "ÂM THANH",
      video: "VIDEO",
      submitted: "ĐÃ GỬI ✓",
      feedback: "GÓP Ý ↗",
      teacherShare: "GIÁO VIÊN / GIAO BÀI",
      studentPractice: "HỌC VIÊN / LUYỆN TẬP",
      differentiator:
        "Học viên không cần học một phần mềm mới chỉ để gửi bài.",
      simpleFlow: "Mở link → Chọn bản thu → Gửi bài",
      note: "Link để gửi bài cho nhanh. Bài, bản thu và góp ý nằm cùng một chỗ thì mới dùng lâu.",
      ctaTitle: "Thử giao bài trên PARA.",
    },
    why: {
      metadataTitle: "Vì sao PARA",
      eyebrow: "VÌ SAO CÓ PARA",
      title: "Khó nhất là lúc tự tập ở nhà.",
      intro:
        "Phần lớn thời gian còn lại là tự tập ở nhà. Đây cũng là lúc dễ gặp khó nhất: quên thầy đã dặn gì, tập mãi một chỗ vẫn chưa đúng, hoặc không biết mình đã khá hơn chưa.",
      missingTitle:
        "Phụ huynh thường nghe con biểu diễn, chưa chắc thấy con đã tập gì ở nhà.",
      missingCopy:
        "PARA được làm ra để việc học không bị ngắt quãng sau khi buổi học kết thúc. Giáo viên vẫn là người nghe và góp ý. Phụ huynh thấy con tập gì, không phải để canh từng buổi.",
      fragments: [
        "Bài tập",
        "Bản thu của học viên",
        "Góp ý của giáo viên",
        "Chỗ cần sửa",
        "Lần tập ở nhà",
        "Khá hơn",
      ],
      scatterAria:
        "Bài tập, bản thu, góp ý của giáo viên và chỗ cần sửa nằm cùng một chỗ.",
      ctaTitle: "Thử giao bài trên PARA.",
    },
    forYou: {
      metadataTitle: "Dành cho bạn",
      eyebrow: "MỖI NGƯỜI MỘT VIỆC",
      title: "Giáo viên, học viên và phụ huynh cần những điều khác nhau.",
      intro:
        "PARA để giáo viên giao bài và góp ý, học viên gửi bài tập ở nhà, phụ huynh xem con đang tập gì.",
      tabsLabel: "Chọn người đang xem",
      views: [
        {
          name: "Giáo viên",
          title: "Nghe bài học viên gửi giữa hai buổi học.",
          copy: "Bài đã giao, lần học viên gửi, và góp ý trước đó nằm cùng một chỗ, để đỡ mất thời gian tìm và còn thời gian dạy.",
          benefits: [
            "Bài và bản thu nằm cùng chỗ",
            "Góp ý nằm đúng bài đã giao",
            "Biết học viên đang tập đến đâu",
          ],
        },
        {
          name: "Học viên",
          title: "Biết chỗ nào còn sai và cần tập lại.",
          copy: "Gửi bài cho nhanh. Đọc góp ý của giáo viên. Biết lần sau cần sửa gì.",
          benefits: [
            "Gửi bài bằng một link",
            "Góp ý chỉ đúng chỗ cần sửa",
            "Tập lại, không bị chấm một lần thu",
          ],
        },
        {
          name: "Phụ huynh",
          title: "Biết con đang tập gì, không cần ngồi canh từng buổi.",
          copy: "Xem bài giáo viên giao, bài con gửi, và góp ý của thầy, để biết con khá hơn chỗ nào.",
          benefits: [
            "Thấy bài con đang tập",
            "Thấy góp ý của giáo viên",
            "Biết con khá hơn chưa",
          ],
        },
      ],
      ctaTitle: "Thử giao bài trên PARA.",
    },
    people: {
      metadataTitle: "Con người",
      eyebrow: "NHỮNG NGƯỜI LÀM RA PARA",
      title: "PARA do Henry và Aaron cùng làm.",
      intro:
        "Henry chơi bass. Aaron chơi guitar và từng dạy guitar. Hai người cùng làm PARA.",
      profiles: [
        {
          name: "Henry Nguyen",
          role: "Đồng sáng lập · Kinh doanh và thị trường",
          description:
            "Henry chơi bass. Anh lo kinh doanh, thị trường, và làm việc với giáo viên, học viên, phụ huynh đang dùng PARA.",
        },
        {
          name: "Aaron Ta",
          role: "Đồng sáng lập · Sản phẩm và công nghệ",
          description:
            "Aaron chơi guitar và từng dạy guitar. Anh lo sản phẩm và công nghệ, để việc giao bài, gửi bài và góp ý giữa hai buổi học đơn giản hơn.",
        },
      ],
      whyEyebrow: "VÌ SAO CHÚNG TÔI LÀM PARA",
      whyTitle: "Học nhạc không dừng lại khi buổi học kết thúc.",
      whyCopy:
        "PARA được làm ra để việc học không bị ngắt quãng sau khi buổi học kết thúc. Giáo viên vẫn giao bài và góp ý. Học viên vẫn gửi bài tập ở nhà.",
      ctaTitle: "Thử giao bài trên PARA.",
    },
    faq: {
      metadataTitle: "Câu hỏi thường gặp",
      eyebrow: "CÂU HỎI THƯỜNG GẶP",
      title: "Một vài điều cần biết về PARA.",
      note: "PARA vẫn đang được thử và hoàn thiện. Một số phần có thể thay đổi. Dùng thử tại paramuzic.com.",
      items: [
        [
          "PARA là gì?",
          "PARA giúp giáo viên giao bài, nghe bài học viên gửi và hướng dẫn chỗ cần sửa giữa hai buổi học.",
        ],
        [
          "PARA dành cho ai?",
          "PARA dành cho giáo viên dạy nhạc, học viên, và phụ huynh được giáo viên cho xem bài của con.",
        ],
        [
          "PARA dùng được chưa?",
          "Có. Vào paramuzic.com để dùng thử.",
        ],
        [
          "Học viên gửi bài tập thế nào?",
          "Học viên mở link trên điện thoại hoặc máy tính, chọn bản thu âm hoặc video đã có, rồi gửi đúng bài giáo viên đã giao.",
        ],
        [
          "Phụ huynh có thể xem gì?",
          "Phụ huynh được cho xem thì thấy bài con đang tập, góp ý của giáo viên, và con đã khá hơn chỗ nào. Giáo viên quyết định ai được xem.",
        ],
        [
          "PARA có thay giáo viên không?",
          "Không. Giáo viên vẫn giao bài, nghe bài và chỉ chỗ cần sửa. PARA giữ những việc đó giữa hai buổi học.",
        ],
        [
          "Học viên có cần tải ứng dụng không?",
          "Không. Mở link trên điện thoại hoặc máy tính là gửi được, không cần tải thêm gì.",
        ],
        [
          "PARA có tính phí không?",
          "Có phần dùng thử. Xem giá tại paramuzic.com.",
        ],
        [
          "Tôi có thể dùng thử không?",
          "Có. Vào paramuzic.com để dùng thử.",
        ],
      ],
    },
    footer: {
      belief: "Góp ý để sửa, không phải để chấm một lần thu.",
      status: "Dùng thử được",
      pronunciation: "Giao bài, nghe bài, sửa chỗ cần sửa",
      contact: "info@paramuzic.com",
      navigationLabel: "Điều hướng cuối trang",
      legalLabel: "Pháp lý",
      legal: [
        ["Quyền riêng tư", "/privacy"],
        ["Điều khoản", "/terms"],
        ["Xóa dữ liệu", "/data-deletion"],
      ],
    },
    skip: "Bỏ qua để đến nội dung chính",
  },
} as const;

export type SiteContent = (typeof content)[Locale];

export function getContent(locale: Locale): SiteContent {
  return content[locale] as SiteContent;
}
