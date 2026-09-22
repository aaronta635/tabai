"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export function CopyLink({ url }: { url: string }) {
  const t = useTranslations("teacher");
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-quiet px-3 py-1.5 text-xs"
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
