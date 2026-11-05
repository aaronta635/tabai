"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { DeletePieceButton } from "@/components/teacher/delete-piece-button";
import { PieceSetupDialog } from "@/components/teacher/piece-setup-dialog";
import { AssignDialog } from "@/components/teacher/assign-dialog";
import { pieceSetupLabel } from "@/lib/piece-setup";
import { createCurriculumPart, moveCurriculumPart, placePieceOnShelf, renameCurriculumPart } from "@/app/teacher/lms-actions";
import { shelfName } from "@/lib/curriculum";

type Part = {
  id: string;
  name: string;
  pieces: {
    id: string;
    title: string;
    description: string | null;
    tips: string | null;
    songKey: string | null;
    tuning: string | null;
    sheetMediaId: string | null;
    tutorialMediaId: string | null;
    clipMediaId: string | null;
  }[];
};

export type PieceStat = {
  reviewed: number;
  total: number;
  due: string | null;
  className: string | null;
};

function ShelfTitle({ stored, onRename }: { stored: string; onRename: (name: string) => Promise<void> }) {
  const locale = useLocale();
  const shown = shelfName(stored, locale);
  const [value, setValue] = useState(shown);

  useEffect(() => {
    setValue(shown);
  }, [shown]);

  return (
    <input
      className="shelf-name"
      aria-label={shown}
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onBlur={() => {
        const next = value.trim();
        if (!next || next === shown) {
          setValue(shown);
          return;
        }
        void onRename(next).catch(() => setValue(shown));
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
      }}
    />
  );
}

export function CurriculumBoard({
  parts,
  classes,
  students,
  stats = {},
}: {
  parts: Part[];
  classes: { id: string; name: string }[];
  students: { id: string; name: string }[];
  stats?: Record<string, PieceStat>;
}) {
  const t = useTranslations("teacher");
  const locale = useLocale();
  const [shelves, setShelves] = useState(parts);
  const [draft, setDraft] = useState("");
  const [overId, setOverId] = useState<string | null>(null);
  const [creatingPartId, setCreatingPartId] = useState<string | null>(null);

  useEffect(() => {
    setShelves(parts);
  }, [parts]);

  function shift(partId: string, dir: "up" | "down") {
    setShelves((current) => {
      const index = current.findIndex((part) => part.id === partId);
      const next = index + (dir === "up" ? -1 : 1);
      if (index < 0 || next < 0 || next >= current.length) return current;
      const copy = current.slice();
      const [row] = copy.splice(index, 1);
      copy.splice(next, 0, row);
      return copy;
    });
    void moveCurriculumPart({ partId, dir });
  }

  function movePiece(pieceId: string, partId: string) {
    const piece = shelves.flatMap((part) => part.pieces).find((row) => row.id === pieceId);
    if (!piece || shelves.some((part) => part.id === partId && part.pieces.some((row) => row.id === pieceId))) return;
    const previous = shelves;
    setShelves(
      shelves.map((part) => ({
        ...part,
        pieces:
          part.id === partId
            ? [piece, ...part.pieces.filter((row) => row.id !== pieceId)]
            : part.pieces.filter((row) => row.id !== pieceId),
      })),
    );
    void placePieceOnShelf({ pieceId, partId }).catch(() => setShelves(previous));
  }

  return (
    <div className="space-y-4">
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const name = draft.trim();
          if (!name) return;
          setDraft("");
          void createCurriculumPart(name).then((created) => {
            if (!created) return;
            setShelves((current) => [...current, { id: created.id, name: created.name, pieces: [] }]);
          });
        }}
      >
        <label className="min-w-0 flex-1">
          <span className="field-label">{t("partName")}</span>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="field mt-1.5"
            placeholder={t("partName")}
          />
        </label>
        <button type="submit" className="btn" disabled={!draft.trim()}>
          {t("addPart")}
        </button>
      </form>
      <p className="text-sm text-ink-soft">{t("curriculumHelp")}</p>

      {shelves.map((part, index) => (
        <section
          key={part.id}
          className={`studio-panel shelf-drop ${overId === part.id ? "is-over" : ""}`}
          onDragOver={(event) => {
            if (![...event.dataTransfer.types].includes("application/x-howl0-piece")) return;
            event.preventDefault();
            setOverId(part.id);
          }}
          onDragLeave={() => setOverId((current) => (current === part.id ? null : current))}
          onDrop={(event) => {
            event.preventDefault();
            setOverId(null);
            const pieceId = event.dataTransfer.getData("application/x-howl0-piece");
            if (pieceId) movePiece(pieceId, part.id);
          }}
        >
          <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <ShelfTitle
                stored={part.name}
                onRename={async (name) => {
                  const previous = shelves;
                  setShelves((current) => current.map((row) => (row.id === part.id ? { ...row, name } : row)));
                  try {
                    await renameCurriculumPart({ partId: part.id, name });
                  } catch (error) {
                    setShelves(previous);
                    throw error;
                  }
                }}
              />
              <p
                className="page-meta"
                draggable
                title={t("dragHint")}
                onDragStart={(event) => {
                  event.dataTransfer.setData("application/x-howl0-part", part.id);
                  event.dataTransfer.effectAllowed = "copy";
                }}
              >
                {t("countPieces", { n: part.pieces.length })}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <AssignDialog partId={part.id} classes={classes} students={students} />
              <button type="button" className="icon-btn" aria-label={t("moveUp")} disabled={index === 0} onClick={() => shift(part.id, "up")}>
                ↑
              </button>
              <button
                type="button"
                className="icon-btn"
                aria-label={t("moveDown")}
                disabled={index === shelves.length - 1}
                onClick={() => shift(part.id, "down")}
              >
                ↓
              </button>
            </div>
          </div>

          {part.pieces.length > 0 ? (
            <table className="studio-table">
              <thead>
                <tr>
                  <th>{t("colPiece")}</th>
                  <th>{t("navSubmissions")}</th>
                  <th>{t("due")}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {part.pieces.map((piece) => {
                  const stat = stats[piece.id];
                  const total = stat?.total ?? 0;
                  const reviewed = stat?.reviewed ?? 0;
                  const width = total > 0 ? Math.round((reviewed / total) * 100) : 0;
                  const saved = pieceSetupLabel(piece, locale === "en" ? "en" : "vi");
                  const files =
                    [
                      saved || null,
                      piece.sheetMediaId ? t("hasSheet") : null,
                      piece.tutorialMediaId ? t("hasTutorial") : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || t("noAttachments");
                  return (
                    <tr
                      key={piece.id}
                      draggable
                      title={t("dragHint")}
                      onDragStart={(event) => {
                        event.dataTransfer.setData("application/x-howl0-piece", piece.id);
                        event.dataTransfer.effectAllowed = "copy";
                      }}
                    >
                      <td>
                        <Link href={`/teacher/curriculum/${piece.id}`} className="font-semibold">
                          {piece.title}
                        </Link>
                        <p className="text-xs text-ink-soft">{stat?.className ?? files}</p>
                      </td>
                      <td>
                        <span className="meter-row">
                          <span>{total > 0 ? `${reviewed}/${total}` : "—"}</span>
                          <span className="meter" aria-hidden>
                            <span style={{ width: `${width}%` }} />
                          </span>
                        </span>
                      </td>
                      <td className="text-sm text-ink-soft">{stat?.due ?? "—"}</td>
                      <td className="text-right">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <select
                            className="shelf-select"
                            aria-label={t("partName")}
                            value={part.id}
                            onChange={(event) => movePiece(piece.id, event.target.value)}
                          >
                            {shelves.map((shelf) => (
                              <option key={shelf.id} value={shelf.id}>
                                {shelfName(shelf.name, locale)}
                              </option>
                            ))}
                          </select>
                          <AssignDialog pieceId={piece.id} classes={classes} students={students} />
                          <DeletePieceButton
                            pieceId={piece.id}
                            label={t("deletePiece")}
                            confirmLabel={t("deletePieceConfirm")}
                            className="btn btn-quiet px-3 py-1.5 text-xs text-danger"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : null}

          <div className="mt-3">
            <button type="button" className="add-trigger" onClick={() => setCreatingPartId(part.id)}>
              <i aria-hidden>+</i>
              <span>{t("addPiece")}</span>
            </button>
          </div>

        </section>
      ))}
      <PieceSetupDialog
        open={creatingPartId != null}
        onClose={() => setCreatingPartId(null)}
        partId={creatingPartId ?? undefined}
      />
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
  onAssigned: (input: {
    classId: string;
    pieceId?: string;
    partId?: string;
    dueAt: string;
  }) => Promise<{ error: string } | { ok: true; count: number } | void>;
}) {
  const t = useTranslations("teacher");
  const [over, setOver] = useState(false);
  const [pending, setPending] = useState<{ pieceId?: string; partId?: string } | null>(null);
  const [dueAt, setDueAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pending || !dueAt) return;
    setBusy(true);
    setError(null);
    try {
      const result = await onAssigned({
        classId,
        pieceId: pending.pieceId,
        partId: pending.partId,
        dueAt,
      });
      if (result && "error" in result) {
        setError(result.error === "due_required" ? t("dueRequired") : t("assignTargetRequired"));
        return;
      }
      setPending(null);
      setDueAt("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setOver(false);
          const pieceId = event.dataTransfer.getData("application/x-howl0-piece") || undefined;
          const partId = event.dataTransfer.getData("application/x-howl0-part") || undefined;
          if (!pieceId && !partId) return;
          setError(null);
          setPending({ pieceId, partId });
        }}
        title={`${t("dropOnClass")} ${name}`}
        className={`drop-chip ${over ? "drop-chip-over" : ""}`}
      >
        <span aria-hidden>↧</span>
        <span>{name}</span>
      </div>
      {pending ? (
        <form className="flex flex-wrap items-center gap-2" onSubmit={save}>
          <input
            type="date"
            required
            aria-label={t("due")}
            value={dueAt}
            onChange={(event) => setDueAt(event.target.value)}
            className="field"
          />
          <button type="submit" disabled={busy} className="btn px-3 py-1.5 text-xs">
            {t("assign")}
          </button>
          <button
            type="button"
            className="btn btn-quiet px-3 py-1.5 text-xs"
            onClick={() => {
              setPending(null);
              setDueAt("");
              setError(null);
            }}
          >
            {t("close")}
          </button>
          {error ? <p className="text-danger text-xs">{error}</p> : null}
        </form>
      ) : null}
    </div>
  );
}
