"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { assignWork } from "@/app/teacher/lms-actions";

export function AssignDialog({
  pieceId,
  partId,
  classes,
  students,
}: {
  pieceId?: string;
  partId?: string;
  classes: { id: string; name: string }[];
  students: { id: string; name: string }[];
}) {
  const t = useTranslations("teacher");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) {
    return (
      <button type="button" className="btn btn-quiet shrink-0 px-3 py-1.5 text-xs" onClick={() => setOpen(true)}>
        {t("assign")}
      </button>
    );
  }

  return (
    <form
      className="add-panel mt-2 w-full space-y-2 text-sm"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const classId = String(data.get("classId") ?? "") || undefined;
        const studentId = String(data.get("studentId") ?? "") || undefined;
        setBusy(true);
        setError(null);
        const result = await assignWork({
          pieceId,
          partId,
          classId,
          studentId,
          dueAt: String(data.get("dueAt") ?? "") || null,
          goal: String(data.get("goal") ?? ""),
        });
        setBusy(false);
        if (result && "error" in result) {
          setError(t("assignTargetRequired"));
          return;
        }
        setOpen(false);
        router.refresh();
      }}
    >
      <select name="classId" className="field">
        <option value="">{t("assignClass")}</option>
        {classes.map((row) => (
          <option key={row.id} value={row.id}>
            {row.name}
          </option>
        ))}
      </select>
      <select name="studentId" className="field">
        <option value="">{t("assignStudent")}</option>
        {students.map((row) => (
          <option key={row.id} value={row.id}>
            {row.name}
          </option>
        ))}
      </select>
      <input type="date" name="dueAt" className="field" />
      <input name="goal" placeholder={t("goal")} className="field" />
      {error ? <p className="text-danger">{error}</p> : null}
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="btn px-3 py-2 text-xs">
          {t("assign")}
        </button>
        <button type="button" className="btn btn-quiet px-3 py-2 text-xs" onClick={() => setOpen(false)}>
          {t("close")}
        </button>
      </div>
    </form>
  );
}
