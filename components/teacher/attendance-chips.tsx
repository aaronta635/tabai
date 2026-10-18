"use client";

import { useEffect, useRef, useState } from "react";
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
  const ticket = useRef(0);
  const queue = useRef(Promise.resolve());

  useEffect(() => {
    setStatus(initial);
  }, [sessionId, studentId, initial]);

  return (
    <div className="flex flex-wrap gap-1">
      {STATUSES.map((value) => (
        <button
          key={value}
          type="button"
          aria-pressed={status === value}
          onClick={() => {
            const mine = ++ticket.current;
            const previous = status;
            setStatus(value);
            queue.current = queue.current.then(async () => {
              try {
                await setAttendance({ sessionId, studentId, status: value });
              } catch {
                if (ticket.current === mine) setStatus(previous);
              }
            });
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
