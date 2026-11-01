import { sceneCopy } from "@/lib/site/studio";
import { content, type Locale } from "@/lib/site/content";
import { ParaIcon } from "@/components/site/ParaIcon";

/** One illustrative passage stays in place. Roles change its annotations,
 * never the recording, timestamps or frame geometry. No player is simulated. */
export function PerspectiveSignal({
  locale,
  active,
}: {
  locale: Locale;
  active: number;
}) {
  const copy = sceneCopy(locale);
  const sample = copy.session;
  return (
    <figure className="practice-session" data-perspective={active}>
      <div className="session-topline">
        <ParaIcon name="assignment" />
        <span>{sample.passage}</span>
      </div>
      <div className="session-passage">
        <p className="session-label">{copy.recording}</p>
        <svg viewBox="0 0 680 240" fill="none" aria-hidden="true">
          <path
            className="session-guide"
            d="M24 60H656M24 120H656M24 180H656"
          />
          <rect
            className="session-selected-passage"
            x="403"
            y="30"
            width="253"
            height="180"
            rx="8"
          />
          <path
            className="session-wave"
            d="M24 120H80L94 74L110 166L128 44L145 185L160 95L178 140L195 66L212 165L230 97L249 137L268 71L287 170L306 89L325 143L345 110L366 158L383 88L399 140L416 64L433 174L450 99L468 137L485 82L502 152L519 108H656"
          />
          <g className="session-feedback-pin">
            <path d="M403 28V212" />
            <circle cx="403" cy="120" r="8" />
          </g>
          <path
            className="session-attempt-path"
            d="M446 202H608M592 186L610 202L592 218"
          />
        </svg>
        <div className="session-timestamps" aria-hidden="true">
          <span>0:00</span>
          <span>0:24</span>
          <span>0:40</span>
        </div>
      </div>
      <div className="session-annotations">
        {[0, 1, 2].map((role) => (
          <div
            key={role}
            className={`session-annotation-panel ${active === role ? "active" : ""}`}
            aria-hidden={active !== role}
            inert={active !== role}
          >
            {role === 0 && (
              <>
                <div className="session-comment">
                  <span className="session-time">0:24</span>
                  <div>
                    <p className="session-label">{copy.feedback}</p>
                    <p>{sample.guidance}</p>
                  </div>
                </div>
                <div className="session-next">
                  <ParaIcon name="arrow-right" />
                  <div>
                    <p className="session-label">{copy.nextPractice}</p>
                    <p>{sample.practice}</p>
                  </div>
                </div>
              </>
            )}
            {role === 1 && (
              <>
                <div className="session-comment">
                  <span className="session-time">0:24</span>
                  <div>
                    <p className="session-label">{copy.nextPractice}</p>
                    <p>{sample.practice}</p>
                  </div>
                </div>
                <div className="session-next">
                  <ParaIcon name="arrow-right" />
                  <div>
                    <p className="session-label">{copy.continue}</p>
                    <p>{copy.instruction}</p>
                  </div>
                </div>
              </>
            )}
            {role === 2 && (
              <>
                <div className="session-comment">
                  <ParaIcon name="review" />
                  <div>
                    <p className="session-label">
                      {content[locale].home.hero.parentView}
                    </p>
                    <p>{sample.progress}</p>
                  </div>
                </div>
                <div className="session-next">
                  <ParaIcon name="arrow-right" />
                  <div>
                    <p className="session-label">{sample.supportLabel}</p>
                    <p>{sample.support}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      <figcaption>{copy.concept}</figcaption>
    </figure>
  );
}
