"use client";

import { useId, type RefObject } from "react";

/** Exact paths and letter offsets from the approved solid optical wordmark:
 * design-resources/PARA_Brand_Resources/01_LOGO/Solid/Web/
 * para-wordmark-white-optical.svg (751 × 210). No font approximation.
 * Only uniform group scaling/translation and mask colour are animated.
 */
export function ParaWordPortal({
  geometry,
}: {
  geometry: RefObject<SVGGElement | null>;
}) {
  const id = useId().replaceAll(":", "");
  return (
    <svg
      className="para-word-portal"
      width="100%"
      height="100%"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <g id={`${id}-word`}>
          <g transform="translate(0 0)">
            <path
              fillRule="evenodd"
              d="M4 0H80C122 0 145 23 145 68C145 113 118 137 80 137H38V206Q38 210 34 210H4Q0 210 0 206V4Q0 0 4 0ZM38 36V100H78C99 100 108 89 108 68C108 47 98 36 78 36Z"
            />
          </g>
          <g transform="translate(163 0)">
            <path
              fillRule="evenodd"
              d="M2 204L80 4Q82 0 87 0H106Q111 0 113 4L191 204Q194 210 188 210H155L136 162H58L39 210H6Q0 210 2 204ZM72 126H122L97 62Z"
            />
          </g>
          <g transform="translate(373 0)">
            <path
              fillRule="evenodd"
              d="M4 0H85C127 0 150 25 150 66C150 93 138 113 116 124L168 204Q172 210 165 210H127L85 135H38V206Q38 210 34 210H4Q0 210 0 206V4Q0 0 4 0ZM38 36V99H82C103 99 113 88 113 67C113 46 103 36 82 36Z"
            />
          </g>
          <g transform="translate(559 0)">
            <path
              fillRule="evenodd"
              d="M2 204L80 4Q82 0 87 0H106Q111 0 113 4L191 204Q194 210 188 210H155L136 162H58L39 210H6Q0 210 2 204ZM72 126H122L97 62Z"
            />
          </g>
        </g>
        <g ref={geometry} id={`${id}-camera`}>
          <use href={`#${id}-word`} />
        </g>
        <mask
          id={`${id}-window`}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="100%"
          height="100%"
          style={{ maskType: "luminance" }}
        >
          <rect width="100%" height="100%" fill="white" />
          <use
            href={`#${id}-camera`}
            fill="black"
            className="portal-aperture"
          />
        </mask>
      </defs>
      <rect
        className="portal-surface"
        width="100%"
        height="100%"
        mask={`url(#${id}-window)`}
      />
      <use
        href={`#${id}-camera`}
        className="portal-word-ink"
        fill="currentColor"
      />
    </svg>
  );
}
