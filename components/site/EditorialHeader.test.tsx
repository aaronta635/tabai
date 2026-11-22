// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { EditorialHeader } from "@/components/site/EditorialHeader";

vi.mock("@/styles/site/editorial-home.css", () => ({}));

it("opens the phone menu with focus inside and closes it on Escape, returning focus", async () => {
  const user = userEvent.setup();
  render(<EditorialHeader />);
  const toggle = screen.getByRole("button", { name: "Menu" });
  expect(toggle).toHaveAttribute("aria-expanded", "false");
  expect(document.getElementById("ed-menu")).toHaveAttribute("hidden");

  await user.click(toggle);
  expect(toggle).toHaveAttribute("aria-expanded", "true");
  expect(document.getElementById("ed-menu")).not.toHaveAttribute("hidden");
  expect(document.activeElement).toHaveTextContent("Product");
  expect(screen.getByRole("group", { name: "Language" })).toBeInTheDocument();

  await user.keyboard("{Escape}");
  expect(toggle).toHaveAttribute("aria-expanded", "false");
  expect(document.activeElement).toBe(toggle);
});

it("points the free-trial CTA at teacher signup", () => {
  render(<EditorialHeader />);
  expect(screen.getByRole("link", { name: /Try for free/ })).toHaveAttribute("href", "/en/signup/teacher");
});

it("keeps the visible VI code in the language links' accessible names", async () => {
  const user = userEvent.setup();
  render(<EditorialHeader />);
  expect(screen.getByRole("link", { name: "VI Switch to Vietnamese" })).toHaveAttribute("href", "/vi");
  await user.click(screen.getByRole("button", { name: "Menu" }));
  const group = screen.getByRole("group", { name: "Language" });
  const links = Array.from(group.querySelectorAll("a"));
  expect(links.map((link) => link.textContent?.trim())).toEqual(["EN", "VI Switch to Vietnamese"]);
  expect(links[0]).toHaveAttribute("aria-current", "true");
});
