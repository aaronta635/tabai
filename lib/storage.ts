import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { MEDIA_BUCKET } from "@/lib/constants";

let cached: SupabaseClient | null = null;

export function supabaseAdmin() {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and a Supabase key are required");
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

export async function createSignedUpload(path: string) {
  const { data, error } = await supabaseAdmin()
    .storage.from(MEDIA_BUCKET)
    .createSignedUploadUrl(path);
  if (error || !data) {
    throw new Error(error?.message ?? "Could not create upload URL");
  }
  return data;
}

export async function createSignedReadUrl(path: string, expiresIn = 60 * 60) {
  const { data, error } = await supabaseAdmin()
    .storage.from(MEDIA_BUCKET)
    .createSignedUrl(path, expiresIn);
  if (error || !data) {
    throw new Error(error?.message ?? "Could not create read URL");
  }
  return data.signedUrl;
}

export async function downloadMedia(path: string) {
  const { data, error } = await supabaseAdmin().storage.from(MEDIA_BUCKET).download(path);
  if (error || !data) {
    throw new Error(error?.message ?? "Could not download media");
  }
  return Buffer.from(await data.arrayBuffer());
}

export async function uploadMedia(path: string, body: Buffer, contentType: string) {
  const { error } = await supabaseAdmin().storage.from(MEDIA_BUCKET).upload(path, body, {
    contentType,
    upsert: true,
  });
  if (error) {
    throw new Error(error.message);
  }
}

export async function removeMedia(path: string) {
  const { error } = await supabaseAdmin().storage.from(MEDIA_BUCKET).remove([path]);
  if (error) {
    throw new Error(error.message);
  }
}
