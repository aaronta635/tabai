"use client";

import { useId, useRef, useState } from "react";
import { useWorkspaceDialogFocus } from "@/components/ui/use-workspace-dialog-focus";
import { ParaIcon } from "@/components/ui/para-icon";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { createClass } from "@/app/teacher/lms-actions";

function CreateClassSubmit() {
  const t = useTranslations("teacher");
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn" disabled={pending}>
      {pending ? t("creatingClass") : t("createClass")}
    </button>
  );
}

export function CreateClassDialog() {
  const t = useTranslations("teacher");
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const nameRef = useRef<HTMLInputElement>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  useWorkspaceDialogFocus(dialogRef, open, () => setOpen(false));

  return (
    <>
      <button type="button" className="add-trigger" onClick={() => setOpen(true)}>
        <i aria-hidden><ParaIcon name="plus" /></i>
        <span>{t("createClass")}</span>
      </button>
      {open ? (
        <div ref={dialogRef} className="schedule-overlay" role="dialog" aria-modal="true" aria-labelledby={titleId}>
          <button type="button" tabIndex={-1} className="schedule-overlay-backdrop" aria-label={t("closePanel")} onClick={() => setOpen(false)} />
          <div className="schedule-sheet">
            <header className="schedule-sheet-head">
              <div>
                <h2 id={titleId} className="font-display text-xl">
                  {t("createClass")}
                </h2>
                <p className="mt-1 text-sm text-ink-soft">{t("classesHelp")}</p>
              </div>
              <button type="button" className="btn btn-quiet px-3 py-1.5 text-sm" onClick={() => setOpen(false)}>
                {t("closePanel")}
              </button>
            </header>
            <form action={createClass} className="space-y-4">
              <label className="block">
                <span className="field-label">{t("className")}</span>
                <input ref={nameRef} name="name" required className="field mt-1.5" />
              </label>
              <label className="block">
                <span className="field-label">{t("inviteEmails")}</span>
                <textarea
                  name="emails"
                  rows={4}
                  placeholder={t("inviteEmailPlaceholder")}
                  className="field mt-1.5"
                />
                <p className="mt-1.5 text-sm text-ink-soft">{t("inviteEmailsHelp")}</p>
              </label>
              <p className="text-sm text-ink-soft">{t("classCodePromise")}</p>
              <CreateClassSubmit />
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
