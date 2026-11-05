import { describe, expect, it } from "vitest";
import { addressAsStudent } from "@/lib/draft-address";

describe("addressAsStudent", () => {
  it("opens with the student's name", () => {
    expect(addressAsStudent("Chào con, bài Happy Birthday con thể hiện rất tốt.", "An")).toBe(
      "Chào An, bài Happy Birthday An thể hiện rất tốt.",
    );
  });

  it("replaces bạn and a capital Con", () => {
    expect(addressAsStudent("Chào bạn. Con bấm nốt sạch.", "An")).toBe("Chào An. An bấm nốt sạch.");
  });

  it("leaves words that only contain those letters", () => {
    expect(addressAsStudent("Giữ nốt còn lại.", "An")).toBe("Giữ nốt còn lại.");
  });

  it("leaves the letter alone when the name is empty", () => {
    expect(addressAsStudent("Chào con.", "  ")).toBe("Chào con.");
  });
});
