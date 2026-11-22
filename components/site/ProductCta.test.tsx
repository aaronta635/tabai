// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { ProductCta } from "@/components/site/ProductCta";
import { teacherSignupHref } from "@/lib/site/signup-href";

it("builds the teacher-signup target for each locale", () => {
  expect(teacherSignupHref("en")).toBe("/en/signup/teacher");
  expect(teacherSignupHref("vi")).toBe("/vi/signup/teacher");
});

it("points the marketing Try for free CTA at teacher signup in English", () => {
  render(<ProductCta locale="en" />);
  expect(screen.getByRole("link", { name: /Try for free/ })).toHaveAttribute("href", "/en/signup/teacher");
});

it("points the marketing Try for free CTA at teacher signup in Vietnamese", () => {
  render(<ProductCta locale="vi" />);
  expect(screen.getByRole("link", { name: /Dùng thử miễn phí/ })).toHaveAttribute("href", "/vi/signup/teacher");
});
