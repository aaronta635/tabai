"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteTeacherTake } from "@/app/teacher/actions";

export function DeleteTakeButton({
  submissionId,
  label,
  confirmLabel,
  afterHref,
  className,
  onDeleted,
  remove = deleteTeacherTake,
  icon,
}: {
  submissionId: string;
  label: string;
  confirmLabel: string;
  afterHref?: string;
  className?: string;
  onDeleted?: () => void;
  remove?: (submissionId: string) => Promise<void>;
  icon?: React.ReactNode;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      className={className ?? "btn-quiet"}
      disabled={pending}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!window.confirm(confirmLabel)) return;
        start(async () => {
          await remove(submissionId);
          onDeleted?.();
          if (afterHref) router.push(afterHref);
          else router.refresh();
        });
      }}
    >
      {icon}{label}
    </button>
  );
}
