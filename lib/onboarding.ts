import type { StudentStage, TutorStage } from "@prisma/client";

export type AccountRole = "tutor" | "student";

export type TutorAnswers = {
  videos: "zalo" | "in_person" | "none";
  size: "few" | "class" | "many";
  focus: "beat" | "notes" | "both";
  teaching?: "new" | "some" | "long";
  skills?: string[];
  weaknesses?: string[];
};

export type StudentAnswers = {
  playing: "weeks" | "months" | "years";
  work: "chords" | "song" | "exam";
  code?: string;
  skills?: string[];
  weaknesses?: string[];
};

export function feedbackLocaleFrom(value: string | null | undefined): "vi" | "en" {
  return value === "en" ? "en" : "vi";
}

export function parseRole(value: string | null | undefined): AccountRole | null {
  if (value === "tutor" || value === "student") return value;
  return null;
}

export function tutorStageFromAnswers(answers: TutorAnswers): TutorStage {
  if (answers.videos === "none") return "starting";
  if (answers.size === "class" || answers.size === "many") return "running";
  return "collecting";
}

export function studentStageFromAnswers(answers: StudentAnswers, joined: boolean): StudentStage {
  if (joined || answers.code?.trim()) return "in_class";
  return "exploring";
}

export function homeFor(role: AccountRole, onboarded: boolean) {
  if (!onboarded) return "/onboarding";
  return role === "student" ? "/student" : "/teacher";
}
