/** @vitest-environment happy-dom */

import { readFileSync } from "node:fs";
import path from "node:path";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RdButton } from "@/components/ui/rd-button";
import { RdCard } from "@/components/ui/rd-card";
import { RdField } from "@/components/ui/rd-field";

const root = path.resolve(__dirname, "../..");
const componentsCss = readFileSync(path.join(root, "styles/app/redesign-components.css"), "utf8");
const previewCss = readFileSync(path.join(root, "app/(dev)/redesign-preview/preview.css"), "utf8");
const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");

describe("RdButton", () => {
  it("renders a real button with its label, primary by default", () => {
    render(<RdButton>Sign in</RdButton>);
    const button = screen.getByRole("button", { name: "Sign in" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveClass("rd-button", "rd-button--primary");
  });

  it("supports secondary and ghost variants", () => {
    render(
      <>
        <RdButton variant="secondary">Create a class</RdButton>
        <RdButton variant="ghost">Forgot password?</RdButton>
      </>,
    );
    expect(screen.getByRole("button", { name: "Create a class" })).toHaveClass("rd-button--secondary");
    expect(screen.getByRole("button", { name: "Forgot password?" })).toHaveClass("rd-button--ghost");
  });

  it("is disabled without losing its label", async () => {
    const onClick = vi.fn();
    render(
      <RdButton disabled onClick={onClick}>
        Sign in
      </RdButton>,
    );
    const button = screen.getByRole("button", { name: "Sign in" });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("keeps the label in place while loading, announces it and ignores clicks", async () => {
    const onClick = vi.fn();
    render(
      <RdButton loading loadingLabel="Đang đăng nhập" onClick={onClick}>
        Đăng nhập
      </RdButton>,
    );
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).toHaveTextContent("Đăng nhập");
    expect(button).toHaveTextContent("Đang đăng nhập");
    expect(button.querySelector(".rd-button__label")).not.toBeNull();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("calls onClick when active", async () => {
    const onClick = vi.fn();
    render(<RdButton onClick={onClick}>Continue</RdButton>);
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});

describe("RdField", () => {
  it("ties the label to the input", () => {
    render(<RdField label="Email" type="email" />);
    expect(screen.getByLabelText("Email")).toHaveAttribute("type", "email");
  });

  it("links the hint and the error with aria-describedby and marks the input invalid", () => {
    render(<RdField label="Mật khẩu" type="password" hint="Ít nhất 8 ký tự." error="Mật khẩu cần ít nhất 8 ký tự." />);
    const input = screen.getByLabelText("Mật khẩu");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Ít nhất 8 ký tự. Mật khẩu cần ít nhất 8 ký tự.");
    const ids = input.getAttribute("aria-describedby")!.split(" ");
    expect(ids).toHaveLength(2);
    expect(document.getElementById(ids[1])).toHaveTextContent("Mật khẩu cần ít nhất 8 ký tự.");
  });

  it("shows the error with an icon as well as colour", () => {
    render(<RdField label="Email" error="Enter a valid email." />);
    const error = screen.getByText("Enter a valid email.").closest(".rd-field__error");
    expect(error?.querySelector("svg.rd-icon")).not.toBeNull();
  });

  it("has no aria-invalid or describedby when there is nothing to describe", () => {
    render(<RdField label="Class name" />);
    const input = screen.getByLabelText("Class name");
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input).not.toHaveAttribute("aria-describedby");
  });

  it("keeps a caller's describedby and shows the optional text", () => {
    render(<RdField label="School name" optionalLabel="(optional)" aria-describedby="extra" hint="Shown to your class." />);
    const input = screen.getByLabelText(/School name/);
    expect(input.getAttribute("aria-describedby")).toMatch(/^extra .+-hint$/);
    expect(screen.getByText("(optional)")).toBeInTheDocument();
  });

  it("gives every field its own id", () => {
    render(
      <>
        <RdField label="One" />
        <RdField label="Two" />
      </>,
    );
    expect(screen.getByLabelText("One").id).not.toBe(screen.getByLabelText("Two").id);
  });
});

describe("RdCard", () => {
  it("renders a title and body", () => {
    render(<RdCard title="I'm a teacher">Give pieces.</RdCard>);
    expect(screen.getByRole("heading", { name: "I'm a teacher" })).toBeInTheDocument();
    expect(screen.getByText("Give pieces.")).toBeInTheDocument();
  });

  it("marks the selected state with words and a tick, not sand alone", () => {
    const { container } = render(
      <RdCard title="Tôi là học viên" selected selectedLabel="Đã chọn">
        Tập bài.
      </RdCard>,
    );
    const card = container.querySelector(".rd-card")!;
    expect(card).toHaveClass("rd-card--selected");
    expect(card).toHaveAttribute("data-selected", "true");
    expect(screen.getByText("Đã chọn")).toBeInTheDocument();
    expect(card.querySelector(".rd-card__selected-mark svg")).not.toBeNull();
  });

  it("shows no selected mark when not selected", () => {
    render(<RdCard title="Plain" />);
    expect(screen.queryByText("Selected")).toBeNull();
  });
});

describe("redesign component styles", () => {
  it("never moves anything: no transform, translate, scale or position transitions", () => {
    for (const css of [componentsCss, previewCss]) {
      const code = stripComments(css);
      expect(code).not.toMatch(/transform|translate|scale\(|rotate/i);
      for (const match of code.matchAll(/transition(?:-property)?:\s*([^;]+);/g)) {
        const props = match[1].split(",").map((part) => part.trim().split(/\s+/)[0]);
        for (const prop of props) expect(["background-color", "border-color", "color", "none"]).toContain(prop);
      }
    }
  });

  it("keeps buttons, fields and the 44px tap size", () => {
    const code = stripComments(componentsCss);
    expect(code).toMatch(/\.rd-button \{[^}]*min-height: var\(--rd-tap\)/);
    expect(code).toMatch(/\.rd-field__input \{[^}]*min-height: var\(--rd-tap\)/);
    // No fixed widths on buttons (100% for full-width phone buttons is fine).
    for (const block of code.split("}")) {
      const [selector, body = ""] = block.split("{");
      if (!selector.includes(".rd-button")) continue;
      expect(body, selector).not.toMatch(/(?:^|[\s;])(?:min-|max-)?width:\s*\d+(?:\.\d+)?(?:px|rem|em|ch)/);
    }
  });

  it("follows the sand rules", () => {
    const code = stripComments(componentsCss);
    // Sand is never used as a text colour, a border or the focus ring.
    expect(code).not.toMatch(/(?:^|[\s;{])color:\s*var\(--rd-sand\)/);
    expect(code).not.toMatch(/border[^:]*:[^;]*--rd-sand\b/);
    expect(code).not.toMatch(/outline[^:]*:[^;]*--rd-sand/);
    expect(code).toMatch(/\.rd-card--selected \{[^}]*background: var\(--rd-sand-tint\)/);
    expect(code).toMatch(/\.rd-card--selected \{[^}]*font-weight: 700/);
  });
});
