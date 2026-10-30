"use client";

import { useTransition } from "react";
import { curateReply, toggleVoice } from "@/app/admin/actions";

export function VoiceToggle({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className="btn btn-quiet mt-2"
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
      className="btn btn-quiet mt-3"
      onClick={() => start(async () => curateReply(id))}
    >
      {label}
    </button>
  );
}
