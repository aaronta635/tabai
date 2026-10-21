# PARA glass / implementation guide

This add-on preserves the approved Musical Window identity. Its live source is HTML/CSS and its decorative source is editable SVG, with a separate raster grain tile. No Figma project or landing-page implementation is claimed.

## Materials

| Material | Fill alpha | Blur desktop / ≤640 px | Grain desktop / mobile | Solid fallback |
|---|---:|---|---|---|
| Ivory Frost | 0.76 | 18px / 10px | 0.08 / 0.045 | `#F3EDE2` |
| Espresso Smoke | 0.82 | 20px / 10px | 0.065 / 0.04 | `#3B2F2A` |
| Quiet Glass | 0.88 | 6px / 0px | 0.035 / 0 | `#F3EDE2` |

The five foundation colours remain Espresso #3B2F2A, Saddle Brown #8B5E34, Sand #D6B98C, Ivory #F3EDE2 and Cool Grey #6B7280. Alpha blends create display tones, not new foundation swatches. JSON includes every RGB, saturation, border, rim, inset shade, low/raised shadow and hover/pressed parameter. Its `cssCustomProperties` object maps exactly to the CSS token values.

Ivory Frost suits Sand and selected warm artwork. Espresso Smoke suits Espresso-led compositions; future stage photos require crop-specific checking. Quiet Glass is denser for compact readability and removes blur/grain on mobile. Do not lower default opacity around essential text without a fresh contrast check.

## Files and load order

```html
<link rel="stylesheet" href="PARA_Glassmorphism_Resources/01_TOKENS/para-glass-tokens.css">
<link rel="stylesheet" href="PARA_Glassmorphism_Resources/02_EFFECTS_CSS/para-glass.css">
<link rel="stylesheet" href="PARA_Glassmorphism_Resources/02_EFFECTS_CSS/para-glass-fallbacks.css">
```

Keep relative texture/overlay URLs intact, or update them when bundling assets. Production styles need no React, Tailwind, WebGL, shader library, JavaScript or build tool. The specimen CSS/JS is an isolated catalogue; do not import its layout or pinned preview states into a website.

## Layering

```html
<div class="para-glass para-glass--ivory para-glass--raised">
  <span class="para-glass__surface" aria-hidden="true"></span>
  <span class="para-glass__texture" aria-hidden="true"></span>
  <span class="para-glass__rim" aria-hidden="true"></span>
  <div class="para-glass__content">Real accessible content</div>
</div>
```

Use application classes for padding and dimensions. The root creates a local stacking context at z-index 0. Surface, texture, optional rim and content use levels 0, 1, 2 and 3. Decoration ignores pointer events. The root does not clip its content or focus indicator. A host container that clips overflow must still be reviewed.

Never put opacity, a filter, a mask or a blend mode on the root to fake the material: these can change its backdrop root and fade or blur its children. Text remains solid and crisp. The default surface is opaque; an @supports enhancement adds live blur/translucency only when a standard or prefixed backdrop-filter is supported.

## Modifiers

- `para-glass--ivory`, `--smoke` or `--quiet`: always choose a material.
- `para-glass--low` / `--raised`: restrained elevation; low is default.
- `para-glass--control` / `--square`: 8 / 4 px radius; default panel is 12 px.
- `para-glass--rising`: optional two-part rising edge, derived from the symbol’s rhythm. Keep it occasional; it is not a glossy stripe or a replacement logo.
- `para-glass--functional`: stronger foreground-coloured boundary. The usual translucent rim is decorative and is not a 3:1 functional boundary guarantee.
- `para-glass--outline`: no fill, blur, texture or elevation. Use only on a quiet, known contrasting field; it provides no protection over a busy photograph.
- `para-glass--interactive`: for native buttons or links, with hover, active and keyboard focus. Do not make a static panel focusable solely to show an outline.

Examples with these classes are in `04_EDITABLE_SOURCE`. The optional rising-edge SVG can stretch as a decorative accent; use the CSS border for responsive outlines rather than distorting an exported rim’s aspect ratio.

## Interaction and accessibility

Hover increases fill alpha, and active increases it again with at most a 1 px displacement. Blur is never continuously animated. Focus combines an Espresso outline and Ivory separation ring; check it against final adjacent colours and clipping. Use at least 44 × 44 px targets around compact controls.

Native buttons activate with Enter/Space. Links keep link semantics. Native `disabled` blocks activation; `aria-disabled="true"` only announces a state, so the application must also prevent the action. Disabled material stays opaque and readable, uses a dashed boundary and removes texture/elevation. State is not communicated only by transparency.

Explicit solid mode can sit on one component, a containing section or the document root:

```html
<section data-para-glass="solid">...glass descendants...</section>
```

Reduced-transparency preference uses opaque fallbacks and removes texture/rims. Its support varies, so keep the explicit override available as an application setting. Reduced-motion preference removes transitions and press displacement. Forced colours use system paints and remove decorative layers. Narrowly scoped `!important` declarations let accessibility paint overrides win over enhancement selectors.

Essential labels should remain solid; forms, long reading sections and small recording controls should normally use solid surfaces. Test actual composited text/background pixels, not only a translucent fill’s nominal hex. If needed, raise opacity, use a separation scrim or choose an opaque fallback. Supplied contrast results do not guarantee arbitrary future imagery.

## Photography / landing page only

No photo was supplied or processed. Later use your own practice/performance photographs, with separate desktop/mobile crops. Keep glass away from faces, fretting fingers and important instrument details. Correct exposure and preserve natural skin/timber tones before adding optional overlays. Dark stage photos can already be noisy: disable extra grain there. The supplied scrims provide separation, not automatic contrast compliance.

## Performance

Begin with one major visible blur area and profile actual hardware before adding more. Avoid nested/overlapping glass, full-screen fixed blur, continuous filter animation and speculative will-change. This is conservative guidance, not a benchmark. The 256 px grain tile is cached/repeated; do not upscale it into coarse static. Optimise copied artwork previews for real responsive sizes during integration without replacing the originals.

At ≤640 px, Frost and Smoke use 10 px blur and lower grain. Quiet uses no blur or grain. Viewport screenshots do not establish physical-device GPU performance. A PNG or SVG overlay cannot blur whatever is behind it later; only the live CSS does that.

## Sources and compatibility

The implementation uses standard backdrop-filter with an applicable -webkit-prefixed counterpart. See `QA_AND_LIMITATIONS.md` for tested engines, preference emulation and remaining checks. Do not claim Safari/iOS testing from a Chromium viewport.

Technical sources:
- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backdrop-filter
- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-transparency
- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion
- https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html
