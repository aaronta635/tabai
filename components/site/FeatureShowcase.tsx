import { DemoVideo } from "@/components/site/DemoVideo";
import { EditorialMotionText } from "@/components/site/EditorialMotionText";
import "@/styles/site/feature-showcase.css";

const demos = [
  {
    id: "take",
    eyebrow: "01 / Submit",
    title: "Your take.",
    copy: "Send your teacher a recording of the passage you’ve been practising.",
    icon: "upload",
    file: "para-your-take-macos",
    description:
      "The student chooses chord-study-take-01.mp4, sends the recording and sees Submitted. The recording is sent to the teacher.",
    caption: "chord-study-take-01.mp4 · Submitted",
  },
  {
    id: "feedback",
    eyebrow: "02 / Feedback",
    title: "Your teacher’s note.",
    copy: "See what your teacher heard, right where it happened.",
    icon: "comment",
    file: "para-your-teachers-note-macos",
    description:
      "The teacher selects 0:24 in the recording and adds: Keep the pulse steady through the chord change. The comment and recording both show the same timestamp.",
    caption:
      "0:24 · Teacher: “Keep the pulse steady through the chord change.”",
  },
  {
    id: "next",
    eyebrow: "03 / Practise",
    title: "Your next try.",
    copy: "Take one clear practice step into your next recording.",
    icon: "repeat",
    file: "para-your-next-try-macos",
    description:
      "The student sees the teacher’s note at 0:24 and the next steps: Replay the change at 0:24. Practise the change slowly, keeping the pulse. Record the same passage again.",
    caption: "Next practice: “Practise the change slowly, keeping the pulse.”",
  },
];

export function FeatureShowcase() {
  return (
    <section
      id="how-it-works"
      className="para-feature-showcase"
      aria-label="How it works"
    >
      <div className="para-feature-column">
        {demos.map((demo) => (
          <article
            key={demo.id}
            className={`para-feature para-feature--${demo.id}`}
            aria-labelledby={`feature-${demo.id}`}
          >
            <div className="para-feature-copy">
              <p className="para-feature-eyebrow">{demo.eyebrow}</p>
              <h2 id={`feature-${demo.id}`}>
                {demo.id === "feedback" ? (
                  <>
                    <EditorialMotionText text="Your" />{" "}
                    <span>
                      <EditorialMotionText text="teacher’s note." />
                    </span>
                  </>
                ) : (
                  <EditorialMotionText text={demo.title} />
                )}
              </h2>
              <p className="para-feature-summary">{demo.copy}</p>
              <img
                className="para-feature-icon"
                src={`/brand/para/homepage/${demo.icon}.svg`}
                alt=""
                width={40}
                height={40}
              />
            </div>
            <DemoVideo
              id={demo.id}
              title={demo.title}
              src={`/brand/para/demos/${demo.file}.mp4`}
              poster={`/brand/para/demos/${demo.id}-poster.webp`}
              description={demo.description}
              caption={demo.caption}
            />
          </article>
        ))}
      </div>
    </section>
  );
}
