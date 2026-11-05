/** @vitest-environment happy-dom */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { StudioTour, openStudioTour, type TourCopy } from "@/components/studio/studio-tour";

const markTourSeen = vi.fn();

vi.mock("@/app/account/tour-actions", () => ({ markTourSeen: (...args: unknown[]) => markTourSeen(...args) }));

const tour: TourCopy = {
  role: "student",
  back: "Back",
  next: "Next",
  close: "Close",
  done: "Done",
  progress: "{n}/{total}",
  steps: [{ href: "/student", title: "Home", body: "Your desk." }],
};

beforeEach(() => {
  markTourSeen.mockReset();
});

it("opens once for an account that has not seen the tour", async () => {
  render(<StudioTour tour={tour} seen={false} />);
  expect(await screen.findByRole("dialog", { name: "Home" })).toBeInTheDocument();
  expect(markTourSeen).toHaveBeenCalledWith("student");
});

it("stays closed for an account that already finished the first visit", () => {
  render(<StudioTour tour={tour} seen />);
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(markTourSeen).not.toHaveBeenCalled();
});

it("still opens from the replay button after the first visit", async () => {
  const user = userEvent.setup();
  render(
    <>
      <button type="button" onClick={openStudioTour}>
        Replay
      </button>
      <StudioTour tour={tour} seen />
    </>,
  );
  expect(screen.queryByRole("dialog")).toBeNull();
  await user.click(screen.getByRole("button", { name: "Replay" }));
  expect(screen.getByRole("dialog", { name: "Home" })).toBeInTheDocument();
  expect(markTourSeen).not.toHaveBeenCalled();
});
