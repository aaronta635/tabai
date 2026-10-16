"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { revertReply } from "@/app/teacher/actions";

export function RevertReplyButton({
  submissionId,
  label,
  confirmLabel,
}: {
  submissionId: string;
  label: string;
  confirmLabel: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      className="desk-action"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(confirmLabel)) return;
        start(async () => {
          const result = await revertReply(submissionId);
          if (result && "error" in result) return;
          router.refresh();
        });
      }}
    >
      {label}
    </button>
  );
}
