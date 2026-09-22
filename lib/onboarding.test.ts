import { describe, expect, it } from "vitest";
import { homeFor, parseRole, studentStageFromAnswers, tutorStageFromAnswers } from "@/lib/onboarding";

describe("onboarding", () => {
  it("parses roles", () => {
    expect(parseRole("tutor")).toBe("tutor");
    expect(parseRole("student")).toBe("student");
    expect(parseRole("admin")).toBeNull();
  });

  it("maps tutor answers to a stage", () => {
    expect(tutorStageFromAnswers({ videos: "none", size: "few", focus: "beat" })).toBe("starting");
    expect(tutorStageFromAnswers({ videos: "zalo", size: "class", focus: "both" })).toBe("running");
    expect(tutorStageFromAnswers({ videos: "in_person", size: "few", focus: "notes" })).toBe("collecting");
  });

  it("puts a coded student in class", () => {
    expect(studentStageFromAnswers({ playing: "weeks", work: "song" }, false)).toBe("exploring");
    expect(studentStageFromAnswers({ playing: "weeks", work: "song", code: "song1" }, false)).toBe("in_class");
  });

  it("sends unfinished accounts to onboarding", () => {
    expect(homeFor("tutor", false)).toBe("/onboarding");
    expect(homeFor("student", true)).toBe("/student");
    expect(homeFor("tutor", true)).toBe("/teacher");
  });
});
