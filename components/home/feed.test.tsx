/** @vitest-environment happy-dom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AssignmentList, ClassChips, FeedBlock, FeedRow } from "@/components/home/feed";

describe("home feed", () => {
  it("renders a class chip row", () => {
    render(
      <ClassChips
        label="Classes"
        chips={[{ id: "c1", name: "Monday", href: "/teacher/classes/c1", color: "beat" }]}
      />,
    );
    const link = screen.getByRole("link", { name: "Monday" });
    expect(link).toHaveAttribute("href", "/teacher/classes/c1");
    expect(link.querySelector(".class-swatch")?.className).toContain("class-tone-beat");
  });

  it("puts the status tone on the row and the count beside the heading", () => {
    render(
      <FeedBlock title="Unanswered" count={2} empty="None">
        <FeedRow href="/teacher/submissions/s1" tone="beat" title="An" meta="Easy 1 · 3 hours" />
      </FeedBlock>,
    );
    expect(screen.getByRole("heading", { name: "Unanswered 2" })).toBeTruthy();
    const row = screen.getByRole("link", { name: /An/ });
    expect(row.className).toContain("feed-row");
    expect(row.className).toContain("class-tone-beat");
  });

  it("shows the empty line when a section has no rows", () => {
    render(
      <FeedBlock title="Due soon" empty="Nothing due">
        {null}
      </FeedBlock>,
    );
    expect(screen.getByText("Nothing due")).toBeTruthy();
  });
});

const assignment = [{ href: "/student/work/a", title: "Exercise A", meta: "Class A", status: "Friday", fraction: "1/1", progress: 1 }];
it("keeps legacy meters by default and labels student piece history without a completion bar", () => {
  const view = render(<AssignmentList title="Pieces" empty="None" rows={assignment} track />);
  expect(view.container.querySelector(".meter")).toBeTruthy();
  view.rerender(<AssignmentList title="Pieces" empty="None" rows={assignment} track historyLabel="Previously sent" />);
  expect(screen.getByText("Previously sent: 1/1")).toBeInTheDocument();
  expect(view.container.querySelector(".meter")).toBeNull();
  expect(screen.getByRole("link", { name: /Exercise A/ })).toHaveAttribute("href", "/student/work/a");
});
