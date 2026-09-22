"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { setAttendance } from "@/app/teacher/lms-actions";

const STATUSES = ["present", "absent", "late", "excused"] as const;

export function AttendanceChips({
  sessionId,
  studentId,
  initial,
}: {
  sessionId: string;
  studentId: string;
  initial: (typeof STATUSES)[number] | null;
}) {
  const t = useTranslations("teacher");
  const [status, setStatus] = useState<(typeof STATUSES)[number] | null>(initial);
  const [busy, setBusy] = useState(false);

  return (
    <div className="flex flex-wrap gap-1">
      {STATUSES.map((value) => (
        <button
          key={value}
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await setAttendance({ sessionId, studentId, status: value });
            setStatus(value);
            setBusy(false);
          }}
          className={`rounded-full px-3 py-1 text-xs ${
            status === value ? "bg-beat text-white" : "border border-ink/20"
          }`}
        >
          {t(value)}
        </button>
      ))}
    </div>
  );
}
