"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function PieceCodeForm({
  placeholder,
  submit,
  variant = "hero",
}: {
  placeholder: string;
  submit: string;
  variant?: "hero" | "bar";
}) {
  const router = useRouter();
  const [code, setCode] = useState("");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next = code.trim().toLowerCase();
    if (!next) return;
    router.push(`/l/${encodeURIComponent(next)}`);
  }

  const shell =
    variant === "hero"
      ? "bg-black/45 text-white backdrop-blur-md"
      : "bg-[#8a8580] text-white";

  return (
    <form
      onSubmit={onSubmit}
      className={`flex w-full items-center rounded-full py-1.5 pl-5 pr-1.5 ${shell}`}
    >
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 bg-transparent py-2 text-[15px] text-white outline-none placeholder:text-white/70"
      />
      <button
        type="submit"
        className="shrink-0 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-[#141210]"
      >
        {submit}
      </button>
    </form>
  );
}
