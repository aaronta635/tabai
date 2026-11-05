"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { PieceForm } from "@/components/teacher/piece-form";
import { useWorkspaceDialogFocus } from "@/components/ui/use-workspace-dialog-focus";

type Props = {
  open: boolean;
  onClose: () => void;
  pieceId?: string;
  partId?: string;
  defaultTitle?: string;
  defaultNote?: string;
  defaultTips?: string;
  defaultSongKey?: string;
  defaultTuning?: string;
  hasSheet?: boolean;
  hasTutorial?: boolean;
  hasClip?: boolean;
  savedTutorialUrl?: string | null;
  savedSheetUrl?: string | null;
  savedSheetKind?: "pdf" | "image" | "musicxml" | "file";
};

export function PieceSetupDialog({ open, onClose, pieceId, ...form }: Props) {
  const t = useTranslations("teacher");
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useWorkspaceDialogFocus(dialogRef, open && mounted, onClose);
  if (!open || !mounted) return null;

  return createPortal(
    <div ref={dialogRef} className="piece-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button type="button" className="piece-modal-backdrop" aria-label={t("closePanel")} onClick={onClose} />
      <div className="piece-modal-card">
        <header className="schedule-sheet-head">
          <h2 id={titleId} className="font-display text-2xl">
            {pieceId ? t("edit") : t("addPiece")}
          </h2>
          <button type="button" className="btn btn-quiet px-3 py-1.5 text-sm" onClick={onClose}>
            {t("closePanel")}
          </button>
        </header>
        <PieceForm pieceId={pieceId} onSaved={onClose} {...form} />
      </div>
    </div>,
    document.body,
  );
}

export function PieceEditor(props: Omit<Props, "open" | "onClose">) {
  const t = useTranslations("teacher");
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="btn" onClick={() => setOpen(true)}>
        {t("edit")}
      </button>
      <PieceSetupDialog open={open} onClose={() => setOpen(false)} {...props} />
    </>
  );
}
