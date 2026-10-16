import Link from "next/link";
import { SectionPanel } from "@/components/disclosure";
import { isClaimableStatus } from "@/lib/forms";

export type CabinetTake = {
  id: string;
  studentName: string;
  when: string;
  status: string;
  kind: string;
  pieceTitle?: string;
};

export type CabinetPiece = {
  pieceId: string;
  pieceTitle: string;
  waiting: number;
  takes: CabinetTake[];
};

export type CabinetClass = {
  classId: string | null;
  className: string;
  waiting: number;
  pieces: CabinetPiece[];
};

export type CabinetCopy = {
  needsReply: string;
  emptyQueue: string;
  loadMore?: string;
};

function statusLabel(status: string, labels: Record<string, string>) {
  return labels[status] ?? status;
}

function TakeRow({
  take,
  statusLabels,
}: {
  take: CabinetTake;
  statusLabels: Record<string, string>;
}) {
  const waiting = isClaimableStatus(take.status);
  return (
    <li className={`take-sleeve${waiting ? " is-waiting" : ""}`}>
      <Link href={`/teacher/submissions/${take.id}`} className="take-sleeve-main">
        <span className="take-sleeve-name">{take.studentName}</span>
        {take.pieceTitle ? <span className="take-sleeve-piece">{take.pieceTitle}</span> : null}
      </Link>
      <span className="take-sleeve-when tabular text-sm text-ink-soft">{take.when}</span>
      <span className="take-sleeve-kind text-sm text-ink-soft">{take.kind}</span>
      <span className={`status-chip${waiting ? "" : " is-quiet"}`}>
        {statusLabel(take.status, statusLabels)}
      </span>
    </li>
  );
}

export function SubmissionCabinet({
  inbox,
  folders,
  copy,
  statusLabels,
  moreHref,
}: {
  inbox: CabinetTake[];
  folders: CabinetClass[];
  copy: CabinetCopy;
  statusLabels: Record<string, string>;
  moreHref?: string | null;
}) {
  return (
    <div className="space-y-4">
      <SectionPanel title={copy.needsReply} count={inbox.length} open={inbox.length > 0}>
        {inbox.length === 0 ? (
          <p className="text-sm text-ink-soft">{copy.emptyQueue}</p>
        ) : (
          <ul className="space-y-2">
            {inbox.map((take) => (
              <TakeRow key={take.id} take={take} statusLabels={statusLabels} />
            ))}
          </ul>
        )}
      </SectionPanel>

      {folders.map((folder) => {
        const takeCount = folder.pieces.reduce((sum, piece) => sum + piece.takes.length, 0);
        return (
          <SectionPanel
            key={folder.classId ?? "none"}
            title={folder.className}
            count={takeCount}
            open={folder.waiting > 0}
          >
            <div className="space-y-2">
              {folder.pieces.map((piece) => (
                <details
                  key={piece.pieceId}
                  className="cabinet-sleeve"
                  open={piece.waiting > 0 || folder.pieces.length === 1}
                >
                  <summary>
                    <span className="cabinet-sleeve-title">{piece.pieceTitle}</span>
                    <span className="panel-count tabular">{piece.takes.length}</span>
                    <span className="panel-chev" aria-hidden>
                      ›
                    </span>
                  </summary>
                  <ul className="mt-2 space-y-2">
                    {piece.takes.map((take) => (
                      <TakeRow key={take.id} take={take} statusLabels={statusLabels} />
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          </SectionPanel>
        );
      })}
      {moreHref && copy.loadMore ? (
        <p>
          <Link href={moreHref} className="btn">
            {copy.loadMore}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
