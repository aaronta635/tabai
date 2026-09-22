/** @vitest-environment happy-dom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AssignmentMeta } from "@/components/student/assignment-meta";
import { PracticeHeatmap } from "@/components/student/practice-heatmap";

describe("AssignmentMeta", () => {
  it("renders nothing without goal or due", () => {
    const { container } = render(
      <AssignmentMeta goal={null} dueLabel={null} goalLabel="Goal" duePrefix="Due" />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows goal and due copy", () => {
    render(<AssignmentMeta goal="Slow and in time" dueLabel="Sun 20 Sep" goalLabel="Goal" duePrefix="Due" />);
    expect(screen.getByText(/Slow and in time/)).toBeInTheDocument();
    expect(screen.getByText(/Sun 20 Sep/)).toBeInTheDocument();
  });
});

describe("PracticeHeatmap", () => {
  it("titles each day with its count", () => {
    render(
      <PracticeHeatmap
        label="This month"
        days={[
          { day: "2026-09-19", count: 0 },
          { day: "2026-09-20", count: 2 },
        ]}
      />,
    );
    expect(screen.getByTitle("2026-09-20: 2")).toBeInTheDocument();
    expect(screen.getByText("This month")).toBeInTheDocument();
  });
});
