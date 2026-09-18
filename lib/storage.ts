import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import { MEDIA_BUCKET } from "@/lib/constants";

let cached: SupabaseClient | null = null;

function realtimeTransport() {
  if (typeof globalThis.WebSocket === "function") return globalThis.WebSocket;
  return WebSocket as unknown as typeof globalThis.WebSocket;
}

export function supabaseAdmin() {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url) {
    throw new Error("SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL is required");
  }
  if (!serviceRole) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is unset. Add the service_role secret from Supabase → Project Settings → API to .env.local. The private media bucket cannot be read with the anon key.",
    );
  }
  cached = createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { transport: realtimeTransport() },
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
