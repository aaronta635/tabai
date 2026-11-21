// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { Navigation } from "@/components/site/Navigation";

const nav = vi.hoisted(() => ({ path: "/en/product" }));
vi.mock("next/navigation", () => ({ usePathname: () => nav.path }));

it("names the other language by its visible code plus what it does, on the same page", () => {
  nav.path = "/en/product";
  render(<Navigation locale="en" />);
  const group = screen.getByRole("group", { name: "Language" });
  expect(screen.getByRole("link", { name: "VI Switch to Vietnamese" })).toHaveAttribute("href", "/vi/product");
  expect(group.querySelector('a[aria-current="true"]')).toHaveTextContent(/^EN$/);
});

it("does the same in Vietnamese", () => {
  nav.path = "/vi/faq";
  render(<Navigation locale="vi" />);
  expect(screen.getByRole("link", { name: "EN Chuyển sang tiếng Anh" })).toHaveAttribute("href", "/en/faq");
});
