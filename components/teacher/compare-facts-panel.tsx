import Link from "next/link";
import { SectionPanel } from "@/components/disclosure";
import { formatIssueWhere, isCompareObservations } from "@/lib/score-model";

type Copy = {
  title: string;
  none: string;
  expected: string;
  observed: string;
  next: string;
  openModel: string;
};

export function CompareFactsPanel({
  observations,
  pieceHref,
  copy,
}: {
  observations: unknown;
  pieceHref: string;
  copy: Copy;
}) {
  const facts = isCompareObservations(observations) ? observations : null;

  return (
    <SectionPanel title={copy.title} open>
      {!facts ? (
        <p className="text-sm text-ink-soft">{copy.none}</p>
      ) : (
        <div className="space-y-3">
          <p className="font-ui text-xs tracking-[0.06em] text-ink-soft">
            fit {Math.round(facts.overallFit * 100)}% · {Math.round(facts.confidence * 100)}%
          </p>
          {facts.positives.length > 0 ? (
            <ul className="space-y-1.5 text-sm leading-relaxed">
              {facts.positives.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : null}
          {facts.issues.length > 0 ? (
            <ul className="space-y-2">
              {facts.issues.map((issue, index) => (
                <li key={`${issue.type}-${index}`} className="piece-row text-sm">
                  <p className="font-ui text-xs uppercase tracking-[0.08em] text-ink-soft">
                    {issue.type}
                    {formatIssueWhere(issue) ? ` · ${formatIssueWhere(issue)}` : ""}
                  </p>
                  <p className="mt-1">
                    {copy.expected}: {issue.expected || "—"}
                  </p>
                  <p>
                    {copy.observed}: {issue.observed || "—"}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}
          {facts.nextPractice ? (
            <p className="text-sm leading-relaxed">
              {copy.next}: {facts.nextPractice}
            </p>
          ) : null}
        </div>
      )}
      <p className="mt-3">
        <Link href={pieceHref} className="text-sm text-beat">
          {copy.openModel}
        </Link>
      </p>
    </SectionPanel>
  );
}
