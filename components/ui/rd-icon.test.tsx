/** @vitest-environment happy-dom */

import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RD_ICONS, RdIcon, isRdIconName, type RdIconName } from "@/components/ui/rd-icon";

describe("RdIcon", () => {
  it("draws a thin line icon hidden from screen readers by default", () => {
    const { container } = render(<RdIcon name="mail" />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("stroke-width", "1.75");
    expect(svg).toHaveClass("rd-icon");
  });

  it("exposes a label when the icon carries meaning on its own", () => {
    const { getByRole } = render(<RdIcon name="alert" label="Error" />);
    expect(getByRole("img", { name: "Error" })).toBeInTheDocument();
  });

  it("keeps every stroke between 1.5 and 2 px", () => {
    for (const stroke of [1.5, 1.75, 2] as const) {
      const { container, unmount } = render(<RdIcon name="check" stroke={stroke} />);
      expect(container.querySelector("svg")).toHaveAttribute("stroke-width", String(stroke));
      unmount();
    }
  });

  it("fails loudly for an unknown name instead of drawing a fallback", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<RdIcon name={"not-an-icon" as RdIconName} />)).toThrow(/unknown icon name "not-an-icon"/);
    error.mockRestore();
    expect(isRdIconName("not-an-icon")).toBe(false);
    expect(isRdIconName("toString")).toBe(false);
  });

  it("maps every name to a real lucide component", () => {
    for (const name of Object.keys(RD_ICONS) as RdIconName[]) {
      const { container, unmount } = render(<RdIcon name={name} />);
      expect(container.querySelector("svg"), name).not.toBeNull();
      unmount();
    }
  });
});

// Compile-time check: an unknown name must not type-check.
// @ts-expect-error "sparkle" is not in RD_ICONS
export const unknownNameIsATypeError = <RdIcon name="sparkle" />;
