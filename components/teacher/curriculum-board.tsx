"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { PieceForm } from "@/components/teacher/piece-form";
import { AssignDialog } from "@/components/teacher/assign-dialog";
import { AddPanel } from "@/components/disclosure";
import { moveCurriculumPart, renameCurriculumPart } from "@/app/teacher/lms-actions";

type Part = {
  id: string;
  name: string;
  pieces: {
    id: string;
    title: string;
    description: string | null;
    tips: string | null;
    sheetMediaId: string | null;
    tutorialMediaId: string | null;
    clipMediaId: string | null;
  }[];
};

export function CurriculumBoard({
  parts,
  classes,
  students,
}: {
  parts: Part[];
  classes: { id: string; name: string }[];
  students: { id: string; name: string }[];
}) {
  const t = useTranslations("teacher");

  return (
    <div className="tile-grid-3">
      {parts.map((part, index) => (
        <details key={part.id} className="tile tile-interactive part-card">
          <summary
            draggable
            title={t("dragHint")}
            onDragStart={(event) => {
              event.dataTransfer.setData("application/x-howl0-part", part.id);
              event.dataTransfer.effectAllowed = "copy";
            }}
          >
            <span className="part-open" aria-hidden>
              ›
            </span>
            <p className="eyebrow">{t("partIndex", { n: index + 1 })}</p>
            <p className="tile-title mt-1.5 pr-6">{part.name}</p>
            <p className="tile-meta">
              <span className="tabular">{t("countPieces", { n: part.pieces.length })}</span>
            </p>
            {part.pieces.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {part.pieces.slice(0, 3).map((piece) => (
                  <li key={piece.id} className="chip">
                    {piece.title}
                  </li>
                ))}
                {part.pieces.length > 3 ? (
                  <li className="chip tabular">+{part.pieces.length - 3}</li>
                ) : null}
              </ul>
            ) : (
              <p className="mt-3">
                <span className="hint-chip">+ {t("addPiece")}</span>
              </p>
            )}
          </summary>

          <div className="part-body">
            {part.pieces.length > 0 ? (
              <ul className="space-y-1.5">
                {part.pieces.map((piece) => (
                  <li
                    key={piece.id}
                    draggable
                    title={t("dragHint")}
                    onDragStart={(event) => {
                      event.dataTransfer.setData("application/x-howl0-piece", piece.id);
                      event.dataTransfer.effectAllowed = "copy";
                    }}
                    className="piece-row"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/teacher/curriculum/${piece.id}`} className="min-w-0">
                        <span className="block">{piece.title}</span>
                        <span className="font-ui block text-xs text-ink-soft">
                          {[
                            piece.sheetMediaId ? t("hasSheet") : null,
                            piece.tutorialMediaId ? t("hasTutorial") : null,
                          ]
                            .filter(Boolean)
                            .join(" · ") || t("noAttachments")}
                        </span>
                      </Link>
                      <AssignDialog pieceId={piece.id} classes={classes} students={students} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mt-3">
              <AddPanel label={t("addPiece")}>
                <PieceForm partId={part.id} />
              </AddPanel>
            </div>

            <div className="part-foot">
              <AssignDialog partId={part.id} classes={classes} students={students} />
              <form action={moveCurriculumPart}>
                <input type="hidden" name="partId" value={part.id} />
                <input type="hidden" name="dir" value="up" />
                <button type="submit" className="icon-btn" aria-label={t("moveUp")}>
                  ↑
                </button>
              </form>
              <form action={moveCurriculumPart}>
                <input type="hidden" name="partId" value={part.id} />
                <input type="hidden" name="dir" value="down" />
                <button type="submit" className="icon-btn" aria-label={t("moveDown")}>
                  ↓
                </button>
              </form>
            </div>

            <details className="sub mt-3">
              <summary>{t("rename")}</summary>
              <form action={renameCurriculumPart} className="mt-2 flex items-end gap-2">
                <input type="hidden" name="partId" value={part.id} />
                <label className="min-w-0 flex-1">
                  <span className="field-label">{t("partName")}</span>
                  <input name="name" defaultValue={part.name} className="field mt-1.5" />
                </label>
                <button type="submit" className="btn btn-quiet px-3 py-2 text-xs">
                  {t("rename")}
                </button>
              </form>
            </details>
          </div>
        </details>
      ))}
    </div>
  );
}

export function ClassDropZone({
  classId,
  name,
  onAssigned,
}: {
  classId: string;
  name: string;
  onAssigned: (input: { classId: string; pieceId?: string; partId?: string }) => Promise<void>;
}) {
  const t = useTranslations("teacher");
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={async (event) => {
        event.preventDefault();
        setOver(false);
        const pieceId = event.dataTransfer.getData("application/x-howl0-piece") || undefined;
        const partId = event.dataTransfer.getData("application/x-howl0-part") || undefined;
        if (pieceId || partId) await onAssigned({ classId, pieceId, partId });
      }}
      title={`${t("dropOnClass")} ${name}`}
      className={`drop-chip ${over ? "drop-chip-over" : ""}`}
    >
      <span aria-hidden>↧</span>
      <span>{name}</span>
    </div>
  );
}
