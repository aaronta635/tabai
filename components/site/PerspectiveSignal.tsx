import { sceneCopy } from "@/lib/site/studio";
import type { Locale } from "@/lib/site/content";
import { ExpressiveIcon } from "@/components/site/ExpressiveIcon";

export function PerspectiveSignal({
  locale,
  active,
}: {
  locale: Locale;
  active: number;
}) {
  const copy = sceneCopy(locale);
  return (
    <figure className="perspective-signal" data-perspective={active}>
      <div role="img" aria-label={copy.perspectives[active]}>
        <div className="perspective-material" aria-hidden="true" />
        <div className="perspective-emblems" aria-hidden="true">
          {["feedback", "next-step", "review"].map((name, index) => (
            <ExpressiveIcon
              key={name}
              name={name}
              className={`perspective-emblem emblem-${index}`}
            />
          ))}
        </div>
        <svg viewBox="0 0 680 440" fill="none" aria-hidden="true">
          <path
            className="perspective-guide"
            d="M40 110H640M40 220H640M40 330H640"
          />
          <path
            className="perspective-thread"
            d="M40 240C160 240 180 140 300 210S480 320 600 245"
          />
          <g className="perspective-view view-teacher">
            <path
              className="perspective-wave"
              d="M40 240H80L94 194L110 286L128 164L145 305L160 215L178 260L195 186L212 285L230 217L249 257L268 191L287 290L306 209L325 263L345 230H600"
            />
            <path
              className="perspective-markers"
              d="M128 110V330M287 110V330M495 110V330"
            />
            <circle className="perspective-pin" cx="128" cy="240" r="11" />
            <circle className="perspective-pin" cx="287" cy="240" r="11" />
            <circle className="perspective-pin" cx="495" cy="240" r="11" />
          </g>
          <g className="perspective-view view-student">
            <path
              className="perspective-next"
              d="M70 290C210 290 170 110 340 180S480 330 600 180M577 182L604 176L600 204"
            />
            <circle className="perspective-pin" cx="340" cy="180" r="11" />
            <path
              className="perspective-wave"
              d="M55 290H90L101 270L113 310L125 252L138 322L151 279L163 303H190"
            />
          </g>
          <g className="perspective-view view-parent">
            <path
              className="perspective-history"
              d="M110 260C200 260 230 180 330 180S470 260 575 145"
            />
            {[
              ["110", "260"],
              ["330", "180"],
              ["575", "145"],
            ].map(([x, y], i) => (
              <g key={x} transform={`translate(${x} ${y})`}>
                <circle className="history-ring" r="38" />
                <path
                  className="history-attempt"
                  d="M-22 0H-12L-8-12L-2 15L5-17L12 8L17 0H25"
                />
                <text className="history-number" y="66" textAnchor="middle">
                  0{i + 1}
                </text>
              </g>
            ))}
          </g>
          <circle className="perspective-origin" cx="600" cy="245" r="7" />
        </svg>
      </div>
      <figcaption>{copy.concept}</figcaption>
    </figure>
  );
}
