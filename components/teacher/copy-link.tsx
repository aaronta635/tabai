"use client";

import { useState } from "react";

export function CopyLink({ url, copy, copied }: { url: string; copy: string; copied: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-quiet px-3 py-1.5 text-xs"
      onClick={async () => {
        await navigator.clipboard.writeText(url);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? copied : copy}
    </button>
  );
}
