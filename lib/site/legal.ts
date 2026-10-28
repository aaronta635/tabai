import type { Locale } from "@/lib/site/content";

export const LEGAL_EMAIL = "aaronta635@gmail.com";

export type LegalSection = {
  heading: string;
  paragraphs: string[];
};

export type LegalDocument = {
  path: "/privacy" | "/terms" | "/data-deletion";
  label: string;
  title: string;
  description: string;
  intro: string;
  updated: string;
  sections: LegalSection[];
};

const control = {
  en: "If this English text differs from the Vietnamese text, the Vietnamese text controls.",
  vi: "Nếu bản tiếng Anh khác bản tiếng Việt, bản tiếng Việt được dùng.",
};

export const legal: Record<Locale, { privacy: LegalDocument; terms: LegalDocument; deletion: LegalDocument }> = {
  en: {
    privacy: {
      path: "/privacy",
      label: "Privacy",
      title: "Privacy policy",
      description: "What Nguyen Ta and Thanh Phong Nguyen keep about teachers and students on PARA.",
      intro:
        "Nguyen Ta and Thanh Phong Nguyen operate PARA in Vietnam. This policy says what we keep about teachers and students, and why.",
      updated: "28 October 2026",
      sections: [
        {
          heading: "Who we are",
          paragraphs: [
            "PARA is a practice room between lessons. Teachers run classes. Students send practice recordings and receive feedback. Nguyen Ta and Thanh Phong Nguyen, two people in Vietnam, operate the service.",
            `Write to ${LEGAL_EMAIL} about this policy.`,
            control.en,
          ],
        },
        {
          heading: "What we collect",
          paragraphs: [
            "We collect the name and email on an account, and whether the account is a teacher or a student. A student also gives a Zalo or Messenger contact and an age band: under 18, or adult. We do not ask for a date of birth.",
            "We keep the classes a person belongs to, attendance, assignments, teacher notes, and the practice recordings a student sends.",
          ],
        },
        {
          heading: "Sign-in with Google, Facebook, or Zalo",
          paragraphs: [
            "If you sign in with Google, Facebook, or Zalo, we receive the name that provider sends and a stable identifier for that sign-in. We receive an email when the provider sends one. Zalo does not send an email.",
            "The provider only learns that you chose to sign in to PARA.",
          ],
        },
        {
          heading: "Practice recordings and feedback",
          paragraphs: [
            "A practice recording is stored so the teacher and the student can return to it. We send the recording to an AI service so a draft of feedback can be written. The teacher reviews that draft. A draft can be wrong, and it is not a finished comment until the teacher treats it as one.",
          ],
        },
        {
          heading: "Who can see a recording",
          paragraphs: [
            "A teacher can see the students, recordings, and notes in that teacher's classes. Another student does not see your recording unless it is placed on the public wall.",
            "A recording goes on that wall only when the student is an adult, the student has allowed it, and the teacher has picked it. A student under 18 is never placed on the public wall.",
          ],
        },
        {
          heading: "Students under 18",
          paragraphs: [
            "A student under 18 may join with the consent on the join form. A parent or the teacher is responsible for that consent. We store only the age band, not a date of birth.",
          ],
        },
        {
          heading: "Payments",
          paragraphs: [
            "We do not sell personal information. We do not charge students, and we do not take student payments. A payment link a teacher adds is between that teacher and the student.",
          ],
        },
        {
          heading: "How long we keep it",
          paragraphs: [
            "We keep account data and recordings while the account is in use, so the class can continue between lessons.",
            "When you delete your account in Settings, the account is removed. That includes the name, email, sign-in, contact, recordings, drafts, replies, and the analysis of those recordings. No user record is kept.",
            "A teacher who deletes their account also removes their classes and pieces, including recordings stored on those pieces. Student accounts are not deleted.",
            "You do this yourself in Settings. The steps are on the /data-deletion.",
          ],
        },
      ],
    },
    terms: {
      path: "/terms",
      label: "Terms",
      title: "Terms",
      description: "The teacher agreement and the student agreement for PARA.",
      intro:
        "These are two agreements. One is with teachers. One is with students. Nguyen Ta and Thanh Phong Nguyen operate PARA in Vietnam.",
      updated: "28 October 2026",
      sections: [
        {
          heading: "The service",
          paragraphs: [
            "PARA is the practice room between lessons. It is not a live classroom. A teacher account and a student account stay separate. Signing in on the student path does not open a teacher account, and signing in on the teacher path does not open a student account.",
            control.en,
          ],
        },
        {
          heading: "Agreement with teachers",
          paragraphs: [
            "You create classes, invite students, and upload sheet music, tutorials, and reference recordings. You are responsible for having the right to upload that material.",
            "You review feedback before a student relies on it. An AI service may draft that feedback, and a draft can be wrong.",
            "You are responsible, with a parent, for the consent of a student under 18 who joins your class. You do not place a student under 18 on a public wall.",
            "PARA does not charge your students and does not take their payments. If you collect fees, including through a payment link you add, that arrangement is between you and the student.",
          ],
        },
        {
          heading: "Agreement with students",
          paragraphs: [
            "You use a teacher's class. You send practice recordings for that class, and you describe yourself honestly as under 18 or adult.",
            "If you are under 18, you may join with the consent on the join form. A parent or your teacher is responsible for that consent, and your recordings are not placed on a public wall.",
            "If you are an adult, a recording is public only when you have allowed it and your teacher has picked it.",
            "You can delete your own account in Settings. The /data-deletion says that no user record is kept.",
          ],
        },
        {
          heading: "Both agreements",
          paragraphs: [
            "Do not upload a recording of someone else and present it as your own practice. We may close an account that breaks these terms.",
            "These terms are governed by the law of Vietnam.",
            `Questions go to ${LEGAL_EMAIL}. Read the /privacy.`,
          ],
        },
      ],
    },
    deletion: {
      path: "/data-deletion",
      label: "Delete your data",
      title: "Delete your data",
      description: "How to ask Nguyen Ta and Thanh Phong Nguyen to delete a PARA account.",
      intro: "Sign in, open Settings, and delete the account. PARA does not keep a user record.",
      updated: "28 October 2026",
      sections: [
        {
          heading: "How to delete",
          paragraphs: [
            "Sign in, open Settings, and choose Delete account. Confirm it there. You do not send an email.",
            control.en,
          ],
        },
        {
          heading: "What is removed",
          paragraphs: [
            "The account is removed. That includes the name, email, sign-in, contact, recordings, drafts, replies, and the analysis of those recordings. No user record is kept.",
          ],
        },
        {
          heading: "Teachers and students",
          paragraphs: [
            "Deleting a teacher account also removes that teacher's classes and pieces, including recordings stored on those pieces. Student accounts are not deleted.",
            "Deleting a student account removes that student and their recordings. The teacher's classes stay.",
          ],
        },
        {
          heading: "Who operates PARA",
          paragraphs: [
            "Nguyen Ta and Thanh Phong Nguyen, in Vietnam, operate PARA. The /privacy describes the rest of what we keep.",
          ],
        },
      ],
    },
  },
  vi: {
    privacy: {
      path: "/privacy",
      label: "Quyền riêng tư",
      title: "Chính sách quyền riêng tư",
      description: "Nguyen Ta và Thanh Phong Nguyen lưu những gì về giáo viên và học viên trên PARA.",
      intro:
        "Nguyen Ta và Thanh Phong Nguyen điều hành PARA tại Việt Nam. Chính sách này nói chúng tôi lưu những gì về giáo viên và học viên, và vì sao.",
      updated: "28 tháng 10 năm 2026",
      sections: [
        {
          heading: "Chúng tôi là ai",
          paragraphs: [
            "PARA là phòng tập giữa các buổi học. Giáo viên giữ lớp. Học viên gửi bài luyện và nhận góp ý. Nguyen Ta và Thanh Phong Nguyen, hai cá nhân tại Việt Nam, điều hành dịch vụ.",
            `Thư về chính sách này gửi tới ${LEGAL_EMAIL}.`,
            control.vi,
          ],
        },
        {
          heading: "Chúng tôi lưu gì",
          paragraphs: [
            "Chúng tôi lưu tên và email của tài khoản, và tài khoản đó là giáo viên hay học viên. Học viên còn cho một liên hệ Zalo hoặc Messenger, và một nhóm tuổi: dưới 18, hoặc người lớn. Chúng tôi không hỏi ngày sinh.",
            "Chúng tôi lưu lớp mà một người thuộc về, điểm danh, bài được giao, ghi chú của giáo viên, và các bản ghi luyện tập mà học viên gửi.",
          ],
        },
        {
          heading: "Đăng nhập bằng Google, Facebook hoặc Zalo",
          paragraphs: [
            "Nếu bạn đăng nhập bằng Google, Facebook hoặc Zalo, chúng tôi nhận tên mà nhà cung cấp gửi và một mã định danh ổn định của lần đăng nhập đó. Chúng tôi nhận email khi nhà cung cấp gửi email. Zalo không gửi email.",
            "Nhà cung cấp chỉ biết bạn đã chọn đăng nhập vào PARA.",
          ],
        },
        {
          heading: "Bản ghi luyện tập và góp ý",
          paragraphs: [
            "Bản ghi luyện tập được lưu để giáo viên và học viên xem lại. Chúng tôi gửi bản ghi tới một dịch vụ trí tuệ nhân tạo để soạn bản nháp góp ý. Giáo viên đọc bản nháp đó. Bản nháp có thể sai, và chưa phải lời góp ý hoàn chỉnh cho đến khi giáo viên dùng nó như vậy.",
          ],
        },
        {
          heading: "Ai được xem bản ghi",
          paragraphs: [
            "Giáo viên xem được học viên, bản ghi và ghi chú trong lớp của giáo viên đó. Học viên khác không xem bản ghi của bạn, trừ khi bản ghi được đưa lên tường công khai.",
            "Bản ghi chỉ lên tường đó khi học viên là người lớn, học viên đã cho phép, và giáo viên đã chọn bản ghi. Học viên dưới 18 không bao giờ được đưa lên tường công khai.",
          ],
        },
        {
          heading: "Học viên dưới 18",
          paragraphs: [
            "Học viên dưới 18 có thể vào lớp với sự đồng ý trên mẫu tham gia. Cha mẹ hoặc giáo viên chịu trách nhiệm về sự đồng ý đó. Chúng tôi chỉ lưu nhóm tuổi, không lưu ngày sinh.",
          ],
        },
        {
          heading: "Thanh toán",
          paragraphs: [
            "Chúng tôi không bán thông tin cá nhân. Chúng tôi không thu phí học viên và không nhận thanh toán của học viên. Liên kết thanh toán mà giáo viên thêm là việc giữa giáo viên đó và học viên.",
          ],
        },
        {
          heading: "Chúng tôi giữ bao lâu",
          paragraphs: [
            "Chúng tôi giữ dữ liệu tài khoản và bản ghi trong lúc tài khoản còn được dùng, để lớp tiếp tục giữa các buổi học.",
            "Khi bạn xóa tài khoản trong Cài đặt, tài khoản bị gỡ. Việc đó gồm tên, email, đăng nhập, liên hệ, bản ghi, bản nháp, lời góp ý và phần phân tích của các bản ghi đó. Không giữ hồ sơ người dùng.",
            "Giáo viên xóa tài khoản thì lớp và bài học của giáo viên đó cũng bị gỡ, kể cả bản ghi đang nằm trong những bài đó. Tài khoản học viên không bị xóa.",
            "Bạn tự làm việc này trong Cài đặt. Các bước nằm ở /data-deletion.",
          ],
        },
      ],
    },
    terms: {
      path: "/terms",
      label: "Điều khoản",
      title: "Điều khoản",
      description: "Thỏa thuận với giáo viên và thỏa thuận với học viên của PARA.",
      intro:
        "Đây là hai thỏa thuận. Một với giáo viên. Một với học viên. Nguyen Ta và Thanh Phong Nguyen điều hành PARA tại Việt Nam.",
      updated: "28 tháng 10 năm 2026",
      sections: [
        {
          heading: "Dịch vụ",
          paragraphs: [
            "PARA là phòng tập giữa các buổi học. PARA không phải lớp học trực tiếp. Tài khoản giáo viên và tài khoản học viên tách riêng. Đăng nhập ở đường học viên không mở tài khoản giáo viên, và đăng nhập ở đường giáo viên không mở tài khoản học viên.",
            control.vi,
          ],
        },
        {
          heading: "Thỏa thuận với giáo viên",
          paragraphs: [
            "Bạn tạo lớp, mời học viên, và tải lên bản nhạc, bài hướng dẫn và bản ghi tham chiếu. Bạn chịu trách nhiệm về quyền tải những tài liệu đó lên.",
            "Bạn đọc góp ý trước khi học viên dựa vào lời đó. Một dịch vụ trí tuệ nhân tạo có thể soạn bản nháp góp ý, và bản nháp có thể sai.",
            "Bạn, cùng với cha mẹ, chịu trách nhiệm về sự đồng ý của học viên dưới 18 khi em vào lớp của bạn. Bạn không đưa học viên dưới 18 lên tường công khai.",
            "PARA không thu phí học viên của bạn và không nhận thanh toán của các em. Nếu bạn thu học phí, kể cả qua liên kết thanh toán bạn thêm, việc đó là giữa bạn và học viên.",
          ],
        },
        {
          heading: "Thỏa thuận với học viên",
          paragraphs: [
            "Bạn học trong lớp của một giáo viên. Bạn gửi bản ghi luyện tập cho lớp đó, và bạn khai đúng mình dưới 18 hay người lớn.",
            "Nếu bạn dưới 18, bạn có thể vào lớp với sự đồng ý trên mẫu tham gia. Cha mẹ hoặc giáo viên chịu trách nhiệm về sự đồng ý đó, và bản ghi của bạn không được đưa lên tường công khai.",
            "Nếu bạn là người lớn, bản ghi chỉ công khai khi bạn đã cho phép và giáo viên đã chọn.",
            "Bạn tự xóa tài khoản trong Cài đặt. /data-deletion nói rằng không giữ hồ sơ người dùng.",
          ],
        },
        {
          heading: "Cả hai thỏa thuận",
          paragraphs: [
            "Đừng tải bản ghi của người khác lên và coi đó là bài luyện của mình. Chúng tôi có thể đóng tài khoản vi phạm các điều khoản này.",
            "Điều khoản này chịu luật Việt Nam.",
            `Câu hỏi gửi tới ${LEGAL_EMAIL}. Đọc /privacy.`,
          ],
        },
      ],
    },
    deletion: {
      path: "/data-deletion",
      label: "Xóa dữ liệu",
      title: "Xóa dữ liệu",
      description: "Cách Nguyen Ta và Thanh Phong Nguyen xóa một tài khoản PARA.",
      intro: "Đăng nhập, mở Cài đặt, và xóa tài khoản. PARA không giữ hồ sơ người dùng.",
      updated: "28 tháng 10 năm 2026",
      sections: [
        {
          heading: "Cách xóa",
          paragraphs: [
            "Đăng nhập, mở Cài đặt, và chọn Xóa tài khoản. Xác nhận ngay tại đó. Bạn không gửi email.",
            control.vi,
          ],
        },
        {
          heading: "Phần bị gỡ",
          paragraphs: [
            "Tài khoản bị gỡ. Việc đó gồm tên, email, đăng nhập, liên hệ, bản ghi, bản nháp, lời góp ý và phần phân tích của các bản ghi đó. Không giữ hồ sơ người dùng.",
          ],
        },
        {
          heading: "Giáo viên và học viên",
          paragraphs: [
            "Xóa tài khoản giáo viên cũng gỡ lớp và bài học của giáo viên đó, kể cả bản ghi đang nằm trong những bài đó. Tài khoản học viên không bị xóa.",
            "Xóa tài khoản học viên thì gỡ học viên đó và các bản ghi của họ. Lớp của giáo viên vẫn còn.",
          ],
        },
        {
          heading: "Ai điều hành PARA",
          paragraphs: [
            "Nguyen Ta và Thanh Phong Nguyen, tại Việt Nam, điều hành PARA. Phần còn lại mà chúng tôi lưu nằm ở /privacy.",
          ],
        },
      ],
    },
  },
};
