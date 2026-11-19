import { localePath } from "@/lib/site/content";

/**
 * The Floot pages are Vietnamese. Links stay relative: the middleware sends product paths
 * (/signup, /login, /c/) to the app host when landing and studio are split, and keeps
 * localhost on localhost in development.
 */
export const marketingPath = (path: string) => localePath("vi", path);

export const siteLinks = {
  signup: marketingPath("/signup"),
  teacherLogin: marketingPath("/login/teacher"),
  studentLogin: marketingPath("/login/student"),
  classBase: marketingPath("/c/"),
  privacy: marketingPath("/privacy"),
  terms: marketingPath("/terms"),
  dataDeletion: marketingPath("/data-deletion"),
  mail: "mailto:info@paramuzic.com",
  logo: "/brand/para/resources/para-horizontal-espresso-optical.svg",
} as const;
