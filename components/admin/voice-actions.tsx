"use client";

import { useTransition } from "react";
import { curateReply, toggleVoice } from "@/app/admin/actions";

export function VoiceToggle({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className="mt-2 text-xs text-brass"
      onClick={() => start(async () => toggleVoice(id))}
    >
      toggle
    </button>
  );
}

export function CurateButton({ id, label }: { id: string; label: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className="mt-3 rounded-full border border-brass/40 px-3 py-1 text-xs text-brass"
      onClick={() => start(async () => curateReply(id))}
    >
      {label}
    </button>
  );
}
