import { SectionPanel } from "@/components/disclosure";
import { ScoreExtractView, extractFromUnknown } from "@/components/teacher/score-extract";
import { HeardPitchChips } from "@/components/teacher/heard-pitch-chips";
import { pitchErrorFromMetrics, pitchNotesFromMetrics } from "@/lib/pitch-overlay";
import { formatWhen } from "@/lib/when";
import type { TutorialCuesJson } from "@/lib/score-model";

type Copy = {
  title: string;
  ready: string;
  training: string;
  failed: string;
  needAssets: string;
  none: string;
  chords: string;
  noChords: string;
  cues: string;
  fromTutorial: string;
  fromSheet: string;
  raw: string;
  help: string;
  tutorialNotes: string;
  heardNotesNone: string;
  heardNotesError: string;
};

export function PieceModelPanel({
  model,
  hasSheet,
  hasTutorial,
  locale,
  copy,
}: {
  model: {
    version: number;
    status: string;
    trainedAt: Date | null;
    error: string | null;
    scoreJson: unknown;
    tutorialCuesJson: unknown;
  } | null;
  hasSheet: boolean;
  hasTutorial: boolean;
  locale: string;
  copy: Copy;
}) {
  if (!model) {
    return (
      <SectionPanel title={copy.title} open>
        <p className="text-sm text-ink-soft">{hasSheet || hasTutorial ? copy.none : copy.needAssets}</p>
      </SectionPanel>
    );
  }

  const statusLabel =
    model.status === "ready" ? copy.ready : model.status === "failed" ? copy.failed : copy.training;
  const extract = extractFromUnknown({
    ...(model.scoreJson && typeof model.scoreJson === "object" ? model.scoreJson : {}),
    tutorialCues: (model.tutorialCuesJson as TutorialCuesJson | null)?.cues ?? [],
  });
  const source = [hasTutorial ? copy.fromTutorial : null, hasSheet ? copy.fromSheet : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <SectionPanel title={copy.title} count={`v${model.version}`} open>
      <p className="text-sm text-ink-soft">{copy.help}</p>
      <p className="mt-2 text-sm">
        {statusLabel}
        {model.trainedAt ? ` · ${formatWhen(model.trainedAt, locale)}` : ""}
        {source ? ` · ${source}` : ""}
      </p>
      {model.status === "failed" && model.error ? (
        <p className="mt-2 text-sm text-danger">{model.error}</p>
      ) : null}
      <div className="mt-3">
        <ScoreExtractView
          extract={extract}
          empty={copy.noChords}
          chordsLabel={copy.chords}
          cuesLabel={copy.cues}
          rawLabel={copy.raw}
        />
        {model.status === "ready" ? (
          <HeardPitchChips
            notes={pitchNotesFromMetrics(model.tutorialCuesJson)}
            error={pitchErrorFromMetrics(model.tutorialCuesJson)}
            label={copy.tutorialNotes}
            empty={copy.heardNotesNone}
            errorLabel={copy.heardNotesError}
          />
        ) : null}
      </div>
    </SectionPanel>
  );
}
