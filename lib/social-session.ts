import { createServerClient } from "@supabase/ssr";
import type { NextResponse } from "next/server";
import { socialAccountEmail, type SocialProfile } from "@/lib/social-oauth";
import { supabaseAdmin } from "@/lib/storage";

/** Opens a Supabase session for a Facebook or Zalo profile. Zalo does not return an email. */
export async function establishSocialSession(response: NextResponse, profile: SocialProfile) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("supabase env");

  const email = socialAccountEmail(profile.provider, profile.id, profile.email);
  const linked = await supabaseAdmin().auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      data: {
        name: profile.name,
        oauth_provider: profile.provider,
        oauth_subject: profile.id,
      },
    },
  });
  const tokenHash = linked.data.properties?.hashed_token;
  if (linked.error || !tokenHash) throw linked.error ?? new Error("social link");

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return [];
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });
  const verified = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" });
  if (verified.error) throw verified.error;
}
