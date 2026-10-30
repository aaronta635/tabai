/** @vitest-environment happy-dom */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { AuthEntrance } from "@/components/auth/auth-entrance";

const labels = {
  eyebrow: "The practice room",
  prompt: "Who is playing?",
  student: "Student",
  teacher: "Teacher",
  hint: "Sign in, or create an account.",
};

describe("AuthEntrance", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("brings the student forward, then opens sign-in", async () => {
    const user = userEvent.setup();
    render(
      <AuthEntrance kind="login" role="student" next="/student" labels={labels}>
        <p>Sign in form</p>
      </AuthEntrance>,
    );

    await user.click(await screen.findByRole("button", { name: "Student" }));

    expect(await screen.findByText("Sign in form", {}, { timeout: 2000 })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Student" })).not.toBeInTheDocument();
  });

  it("keeps the form open when this tab already chose a role", async () => {
    sessionStorage.setItem("para-auth-entered", "1");
    render(
      <AuthEntrance kind="signup" role="student" next="/join/kmprt" labels={labels}>
        <p>Create account form</p>
      </AuthEntrance>,
    );

    expect(await screen.findByText("Create account form")).toBeInTheDocument();
  });
});
