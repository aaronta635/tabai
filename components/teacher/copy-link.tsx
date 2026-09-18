"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export function CopyLink({ url }: { url: string }) {
  const t = useTranslations("teacher");
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="mt-3 rounded-full border border-ink/20 px-3 py-1 text-sm"
      onClick={async () => {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? t("linkCopied") : t("copyLink")}
    </button>
  );
}
