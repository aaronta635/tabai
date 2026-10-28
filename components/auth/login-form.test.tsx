/** @vitest-environment happy-dom */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/components/auth/login-form";
import { SignupForm } from "@/components/auth/signup-form";
import { mockRouter } from "@/test/setup";

const signInWithPassword = vi.fn();
const signInWithOAuth = vi.fn();
const signUp = vi.fn();
const signOut = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createBrowserSupabase: () => ({
    auth: {
      signInWithPassword,
      signInWithOAuth,
      signOut,
      signUp,
      getSession: vi.fn(async () => ({ data: { session: null } })),
    },
  }),
}));

const loginLabels = {
  welcome: "Welcome back",
  welcomeSub: "Sign in to your practice room.",
  iAm: "I am a",
  teacher: "Teacher",
  student: "Student",
  email: "Email",
  password: "Password",
  signInAs: "Sign in as {role}",
  wrongRoleTutor: "This email is a teacher account. Sign in as a teacher.",
  wrongRoleStudent: "This email is a student account. Sign in as a student.",
  google: "Google",
  facebook: "Facebook",
  zalo: "Zalo",
  orWithEmail: "or with email",
  forgot: "Forgot password?",
  forgotNeedEmail: "Enter your email, then ask for the reset link.",
  resetSent: "Check your email for the reset link.",
  newHere: "New to howl0?",
  createLink: "Create an account",
  providerFailed: "That sign-in did not start.",
};

describe("LoginForm", () => {
  beforeEach(() => {
    signInWithPassword.mockReset();
    signInWithOAuth.mockReset();
    signUp.mockReset();
    signOut.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("does not open a teacher session from student sign-in", async () => {
    signInWithPassword.mockResolvedValue({ error: null });
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "role_mismatch", actual: "tutor" }),
    } as Response);

    const user = userEvent.setup();
    render(<LoginForm initialRole="student" next="/student" labels={loginLabels} />);

    await user.type(screen.getByLabelText("Email"), "teacher@studio.test");
    await user.type(screen.getByLabelText("Password"), "secret1");
    await user.click(screen.getByRole("button", { name: "Sign in as Student" }));

    expect(await screen.findByText(loginLabels.wrongRoleTutor)).toBeInTheDocument();
    expect(signOut).toHaveBeenCalled();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it("opens the bound studio with a full load so another student's cached page cannot stick", async () => {
    signInWithPassword.mockResolvedValue({ error: null });
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, next: "/student" }),
    } as Response);
    const assign = vi.fn();
    vi.stubGlobal(
      "location",
      Object.assign(window.location, { assign }),
    );

    const user = userEvent.setup();
    render(<LoginForm initialRole="student" next="/student" labels={loginLabels} />);
    await user.type(screen.getByLabelText("Email"), "an@studio.test");
    await user.type(screen.getByLabelText("Password"), "secret1");
    await user.click(screen.getByRole("button", { name: "Sign in as Student" }));

    expect(assign).toHaveBeenCalledWith("/student");
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it("links to the signup page instead of swapping the form", () => {
    render(<LoginForm initialRole="student" next="/student" labels={loginLabels} />);
    expect(screen.getByRole("link", { name: "Create an account" })).toHaveAttribute(
      "href",
      "/signup/student",
    );
    expect(screen.queryByRole("heading", { name: "Create your practice room" })).not.toBeInTheDocument();
  });

  it("starts Google through Supabase and Facebook and Zalo through PARA", async () => {
    signInWithOAuth.mockResolvedValue({ error: null });
    const assign = vi.fn();
    vi.stubGlobal("location", Object.assign(window.location, { assign }));
    const user = userEvent.setup();
    const cases = ["Google", "Facebook", "Zalo"] as const;

    for (const name of cases) {
      const view = render(<LoginForm initialRole="student" next="/student" labels={loginLabels} />);
      await user.click(screen.getByRole("button", { name }));
      view.unmount();
    }

    expect(signInWithOAuth).toHaveBeenCalledTimes(1);
    expect(signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "google",
        options: expect.objectContaining({
          skipBrowserRedirect: true,
          queryParams: { prompt: "select_account" },
          redirectTo: "https://paramuzic.com/auth/callback?role=student&next=%2Fstudent",
        }),
      }),
    );
    expect(assign).toHaveBeenNthCalledWith(
      1,
      "/api/auth/social/facebook/start?role=student&next=%2Fstudent&from=login",
    );
    expect(assign).toHaveBeenNthCalledWith(
      2,
      "/api/auth/social/zalo/start?role=student&next=%2Fstudent&from=login",
    );
  });
});

describe("SignupForm", () => {
  it("is its own page and links back to login", () => {
    render(
      <SignupForm
        initialRole="tutor"
        next="/teacher"
        labels={{
          createTitle: "Create your practice room",
          createSub: "Teachers and students start in different rooms.",
          iAm: "I am a",
          teacher: "Teacher",
          student: "Student",
          email: "Email",
          password: "Password",
          confirmPassword: "Confirm password",
          passwordMismatch: "Those passwords do not match.",
          signUpAs: "Create a {role} account",
          checkEmail: "Check email",
          wrongRoleTutor: "teacher",
          wrongRoleStudent: "student",
          google: "Google",
          facebook: "Facebook",
          zalo: "Zalo",
          orWithEmail: "or with email",
          haveAccount: "Already have an account?",
          signInLink: "Sign in",
          providerFailed: "That sign-in did not start.",
        }}
      />,
    );
    expect(screen.getByRole("heading", { name: "Create your practice room" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/login/teacher",
    );
    expect(screen.queryByRole("button", { name: "Forgot password?" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Confirm password")).toBeInTheDocument();
  });

  it("does not create an account when the passwords differ", async () => {
    const user = userEvent.setup();
    render(
      <SignupForm
        initialRole="student"
        next="/student"
        labels={{
          createTitle: "Create your practice room",
          createSub: "Teachers and students start in different rooms.",
          iAm: "I am a",
          teacher: "Teacher",
          student: "Student",
          email: "Email",
          password: "Password",
          confirmPassword: "Confirm password",
          passwordMismatch: "Those passwords do not match.",
          signUpAs: "Create a {role} account",
          checkEmail: "Check email",
          wrongRoleTutor: "teacher",
          wrongRoleStudent: "student",
          google: "Google",
          facebook: "Facebook",
          zalo: "Zalo",
          orWithEmail: "or with email",
          haveAccount: "Already have an account?",
          signInLink: "Sign in",
          providerFailed: "That sign-in did not start.",
        }}
      />,
    );

    await user.type(screen.getByLabelText("Email"), "an@studio.test");
    await user.type(screen.getByLabelText("Password"), "secret1");
    await user.type(screen.getByLabelText("Confirm password"), "secret2");
    await user.click(screen.getByRole("button", { name: "Create a Student account" }));

    expect(await screen.findByText("Those passwords do not match.")).toBeInTheDocument();
    expect(signUp).not.toHaveBeenCalled();
  });
});
