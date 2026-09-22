"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function PieceCodeForm({
  placeholder,
  submit,
  variant = "hero",
  productOrigin = "",
}: {
  placeholder: string;
  submit: string;
  variant?: "hero" | "bar" | "studio";
  productOrigin?: string;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next = code.trim().toLowerCase();
    if (!next) return;
    const path = `/c/${encodeURIComponent(next)}`;
    if (productOrigin) {
      window.location.assign(`${productOrigin}${path}`);
      return;
    }
    router.push(path);
  }

  const shell =
    variant === "studio"
      ? "text-[#35242d]"
      : variant === "hero"
        ? "bg-black/45 text-white backdrop-blur-md"
        : "bg-[#8a8580] text-white";
  const button =
    variant === "studio"
      ? "landing-cta landing-cta-compact"
      : "bg-white text-[#141210]";

  return (
    <form
      onSubmit={onSubmit}
      className={`landing-code-form flex w-full items-center rounded-full py-1.5 pl-5 pr-1.5 ${shell}`}
    >
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 bg-transparent py-2 text-[15px] text-inherit outline-none placeholder:text-current/60"
      />
      <button type="submit" className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-medium ${button}`}>
        {submit}
      </button>
    </form>
  );
}
