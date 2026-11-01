/** Original lightweight geometry, using the package's warm/deep recipes.
 * A static SVG is the default; section visibility enables CSS motion. */
export function GradientWave() {
  return (
    <div className="gradient-wave" aria-hidden="true">
      <div className="gradient-wave-depth">
        <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient
              id="para-wave-warm"
              x1="0"
              y1="0"
              x2=".92"
              y2=".85"
              gradientUnits="objectBoundingBox"
            >
              <stop stopColor="var(--para-ivory)" />
              <stop offset=".36" stopColor="var(--para-sand)" />
              <stop offset="1" stopColor="var(--para-saddle-brown)" />
            </linearGradient>
            <linearGradient id="para-wave-deep" x1=".12" y1="0" x2=".85" y2="1">
              <stop stopColor="var(--para-saddle-brown)" />
              <stop offset=".35" stopColor="var(--para-sand)" />
              <stop offset=".64" stopColor="var(--para-saddle-brown)" />
              <stop offset="1" stopColor="var(--para-espresso)" />
            </linearGradient>
          </defs>
          <g className="wave-ribbon wave-ribbon-back">
            <path
              fill="url(#para-wave-warm)"
              d="M350 1060C240 680 860 875 760 440S1200-120 1670 70L1690 1100Z"
            />
          </g>
          <g className="wave-ribbon wave-ribbon-front">
            <path
              fill="url(#para-wave-deep)"
              d="M570 1090C310 680 1120 840 960 420S1470-40 1720 180L1740 1120Z"
            />
            <path
              fill="none"
              stroke="var(--para-ivory)"
              strokeOpacity=".32"
              strokeWidth="1.5"
              d="M570 1090C310 680 1120 840 960 420S1470-40 1720 180"
            />
          </g>
        </svg>
      </div>
      <div className="gradient-wave-grain" />
    </div>
  );
}
