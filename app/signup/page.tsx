import { redirect } from "next/navigation";
import { parseRole } from "@/lib/onboarding";
import { authPath } from "@/lib/return-path";

export default async function SignupIndex({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; role?: string; error?: string }>;
}) {
  const search = await searchParams;
  const role = search.role === "teacher" || search.role === "tutor" ? "tutor" : parseRole(search.role) ?? "student";
  const dest = new URL(authPath("signup", role, search.next), "http://howl0.local");
  if (search.error) dest.searchParams.set("error", search.error);
  redirect(`${dest.pathname}${dest.search}`);
}
