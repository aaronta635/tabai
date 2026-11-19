export interface FaqItem {
  q: string;
  a: string;
  /** Shown on the home page short list. */
  home?: boolean;
}

export const faqItems: FaqItem[] = [
  {
    q: "PARA là gì?",
    a: "PARA giúp thầy cô giao bài, nghe bài học viên gửi và hướng dẫn chỗ cần sửa giữa hai buổi học.",
  },
  {
    q: "PARA dành cho ai?",
    a: "PARA dành cho thầy cô dạy nhạc, học viên, và phụ huynh được thầy cô cho xem bài của con.",
  },
  {
    q: "PARA có thay thầy cô không?",
    a: "Không. Thầy cô vẫn giao bài, nghe bài và chỉ chỗ cần sửa. PARA giữ những việc đó giữa hai buổi học.",
    home: true,
  },
  {
    q: "AI có chấm bài của con tôi không?",
    a: "Không. AI chỉ giúp thầy cô nghe nhanh hơn. Không có nhận xét nào từ AI đến con mà chưa qua thầy cô.",
    home: true,
  },
  {
    q: "Học viên gửi bài tập thế nào?",
    a: "Học viên mở link trên điện thoại hoặc máy tính, chọn bản thu âm hoặc video đã có, rồi gửi đúng bài thầy cô đã giao.",
  },
  {
    q: "Học viên có cần tải ứng dụng không?",
    a: "Không. Mở link trên điện thoại hoặc máy tính là gửi được, không cần tải thêm gì.",
    home: true,
  },
  {
    q: "Ai xem được bản thu?",
    a: "Người thu và thầy cô. Phụ huynh chỉ xem khi được cho xem. Không công khai mặc định.",
    home: true,
  },
  {
    q: "Phụ huynh có thể xem gì?",
    a: "Phụ huynh được cho xem thì thấy bài con đang tập, góp ý của thầy cô, và con đã khá hơn chỗ nào. Thầy cô quyết định ai được xem. Phần này vẫn đang hoàn thiện.",
  },
  {
    q: "Có cần quay video không?",
    a: "Không bắt buộc. Bản thu âm là đủ. Camera tắt mặc định với học viên dưới 18 tuổi.",
  },
  {
    q: "Thầy cô của tôi chưa dùng PARA?",
    a: "Hãy nhắn thầy cô thử PARA. PARA bắt đầu từ thầy cô, không phải từ học viên. Thầy cô có thể dùng thử ngay bằng nút Dùng thử miễn phí.",
  },
  {
    q: "PARA có tính phí không?",
    a: "Hiện có phần dùng thử miễn phí. Giá sẽ được công bố khi chốt cùng các thầy cô đang dùng thử.",
    home: true,
  },
];
