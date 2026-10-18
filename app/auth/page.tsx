import { redirect } from "next/navigation";
import { authPath, parseAuthSegment } from "@/lib/return-path";
import { parseRole } from "@/lib/onboarding";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; role?: string; error?: string }>;
}) {
  const search = await searchParams;
  const role = parseAuthSegment(search.role) ?? parseRole(search.role) ?? "student";
  const dest = new URL(authPath("login", role, search.next), "http://howl0.local");
  if (search.error) dest.searchParams.set("error", search.error);
  redirect(`${dest.pathname}${dest.search}`);
}
