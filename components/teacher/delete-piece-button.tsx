"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { archivePiece } from "@/app/teacher/actions";
import { useWorkspaceDialogFocus } from "@/components/ui/use-workspace-dialog-focus";

export function DeletePieceButton({
  pieceId,
  label,
  confirmLabel,
  afterHref,
  className,
  remove = archivePiece,
}: {
  pieceId: string;
  label: string;
  confirmLabel: string;
  afterHref?: string;
  className?: string;
  remove?: (pieceId: string) => Promise<void>;
}) {
  const t = useTranslations("teacher");
  const router = useRouter();
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  useWorkspaceDialogFocus(dialogRef, open, () => {
    if (!pending) setOpen(false);
  });

  return (
    <>
      <button
        type="button"
        className={className ?? "btn-quiet text-danger"}
        disabled={pending}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen(true);
        }}
      >
        {label}
      </button>
      {open ? (
        <div ref={dialogRef} className="schedule-overlay" role="alertdialog" aria-modal="true" aria-labelledby={titleId}>
          <button
            type="button"
            tabIndex={-1}
            className="schedule-overlay-backdrop"
            aria-label={t("closePanel")}
            onClick={() => setOpen(false)}
          />
          <div className="schedule-sheet">
            <h2 id={titleId} className="font-display text-xl">
              {label}
            </h2>
            <p className="mt-2 text-sm leading-relaxed">{confirmLabel}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className="btn btn-quiet" disabled={pending} onClick={() => setOpen(false)}>
                {t("deletePieceKeep")}
              </button>
              <button
                type="button"
                className="btn"
                disabled={pending}
                onClick={() => {
                  setPending(true);
                  void remove(pieceId)
                    .then(() => {
                      setOpen(false);
                      if (afterHref) router.push(afterHref);
                      else router.refresh();
                    })
                    .catch(() => setPending(false));
                }}
              >
                {label}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
