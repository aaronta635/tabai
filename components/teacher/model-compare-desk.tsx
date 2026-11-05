import { SectionPanel } from "@/components/disclosure";
import { ScoreExtractView, extractFromUnknown } from "@/components/teacher/score-extract";
import { HeardPitchChips } from "@/components/teacher/heard-pitch-chips";
import { TakeAnalyzeStatus } from "@/components/teacher/take-analyze-status";
import { type AnalyzeJobView, type AnalyzeStatusCopy } from "@/lib/analyze-status";
import { pitchErrorFromMetrics, pitchNotesFromMetrics } from "@/lib/pitch-overlay";
import {
  chordSequenceDelta,
  chordsFromScore,
  parseTrainExtract,
  type TutorialCuesJson,
} from "@/lib/score-model";

type Copy = {
  title: string;
  piece: string;
  take: string;
  emptyPiece: string;
  emptyTake: string;
  chords: string;
  takeChords: string;
  cues: string;
  takeCues: string;
  raw: string;
  onlyPiece: string;
  onlyTake: string;
  help: string;
  heardNotes: string;
  tutorialNotes: string;
  heardNotesNone: string;
  heardNotesError: string;
};

export function ModelCompareDesk({
  pieceModel,
  heardJson,
  metricsJson,
  copy,
  analyze,
}: {
  pieceModel: { scoreJson: unknown; tutorialCuesJson: unknown } | null;
  heardJson: unknown;
  metricsJson?: unknown;
  copy: Copy;
  analyze?: { job: AnalyzeJobView | null; copy: AnalyzeStatusCopy };
}) {
  const piece = pieceModel
    ? parseTrainExtract({
        ...(pieceModel.scoreJson && typeof pieceModel.scoreJson === "object" ? pieceModel.scoreJson : {}),
        tutorialCues: (pieceModel.tutorialCuesJson as TutorialCuesJson | null)?.cues ?? [],
      })
    : null;
  const heard = extractFromUnknown(heardJson);
  const heardNotes = pitchNotesFromMetrics(metricsJson);
  const pitchError = pitchErrorFromMetrics(metricsJson);
  const tutorialNotes = pitchNotesFromMetrics(pieceModel?.tutorialCuesJson);
  const tutorialError = pitchErrorFromMetrics(pieceModel?.tutorialCuesJson);
  const delta =
    piece && heard ? chordSequenceDelta(chordsFromScore(piece), chordsFromScore(heard)) : null;
  const waitingOnJob = Boolean(analyze) && !heard;

  return (
    <SectionPanel title={copy.title} open>
      <p className="text-sm text-ink-soft">{copy.help}</p>
      {delta && (delta.onlyExpected.length > 0 || delta.onlyHeard.length > 0) ? (
        <p className="mt-2 text-sm">
          {delta.onlyExpected.length > 0 ? `${copy.onlyPiece}: ${delta.onlyExpected.join(" · ")}. ` : ""}
          {delta.onlyHeard.length > 0 ? `${copy.onlyTake}: ${delta.onlyHeard.join(" · ")}.` : ""}
        </p>
      ) : null}
      <div className="model-desk mt-3">
        <section className="tile">
          <p className="tile-title">{copy.piece}</p>
          <div className="mt-2">
            <ScoreExtractView
              extract={piece}
              empty={copy.emptyPiece}
              chordsLabel={copy.chords}
              cuesLabel={copy.cues}
              rawLabel={copy.raw}
            />
            <HeardPitchChips
              notes={tutorialNotes}
              error={tutorialError}
              label={copy.tutorialNotes}
              empty={copy.heardNotesNone}
              errorLabel={copy.heardNotesError}
            />
          </div>
        </section>
        <section className="tile">
          <p className="tile-title">{copy.take}</p>
          <div className="mt-2">
            {waitingOnJob && analyze ? (
              <TakeAnalyzeStatus job={analyze.job} copy={analyze.copy} />
            ) : (
              <ScoreExtractView
                extract={heard}
                empty={copy.emptyTake}
                chordsLabel={copy.takeChords}
                cuesLabel={copy.takeCues}
                rawLabel={copy.raw}
              />
            )}
            {waitingOnJob ? null : (
              <HeardPitchChips
                notes={heardNotes}
                error={pitchError}
                label={copy.heardNotes}
                empty={copy.heardNotesNone}
                errorLabel={copy.heardNotesError}
              />
            )}
          </div>
        </section>
      </div>
    </SectionPanel>
  );
}
