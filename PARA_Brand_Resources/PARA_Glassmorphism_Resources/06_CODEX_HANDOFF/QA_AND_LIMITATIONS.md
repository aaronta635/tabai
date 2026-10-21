# Quality checks and remaining limitations

## Completed

- Rendered offline from a direct local file URL in headless **Chromium 153.0.8010.0**, Linux with software rendering. No server, build or network asset was required.
- Checked widths **1440, 1024, 768, 390 and 320 px**: no document overflow, broken images or clipped glass-content text. Quiet Glass has no blur on mobile.
- Verified live hover/pressed fills, keyboard focus, native disabled behaviour and root opacity 1.
- Explicit solid mode, emulated reduced transparency and forced colours remove blur/texture and use opaque paints. Reduced motion removes transitions. The unsupported-feature branch was forced through a test stylesheet; an actual legacy browser was not run.
- **50 actual composited text/background rectangles** pass normal-text AA. Minimum **5.576:1**, above 4.5:1. Per-sample worst RGB values are recorded in `contrast-checks.json`.
- Browser font inspection confirms Plus Jakarta Sans and Be Vietnam Pro for Vietnamese specimens. Bundled fonts cover all visible specimen characters without missing glyphs.
- 23 local HTML/CSS paths resolve. No actual specimen resource failed and no external request or script error occurred. A separate auxiliary DevTools font-inspection file-origin warning is recorded; it is not a failed specimen asset.
- Overlays parse as editable SVGs; their PNGs retain alpha, with genuinely transparent centres for non-scrim overlays. Tokens match JSON exactly.
- The original 42 source entries were recovered with verified ZIP CRCs. Logo, effect CSS, tokens, gradients, texture, fonts and approved illustration/icon assets were preserved. The specimen presentation and handoff were restored and re-rendered.
- The delivery archive is closed, flushed, CRC-tested and checked against a SHA-256 file manifest before saving. Its saved copy is checked again after replacement.

## Remaining checks

- Safari, Firefox, WebKit and physical iOS/Android devices have not been tested. Viewport emulation is not physical-device rendering or GPU performance evidence.
- Reduced-transparency media support varies; retain explicit `data-para-glass="solid"` mode.
- Future real photographs and changed crops need fresh contrast checks. None was supplied or processed.
- Decorative rims are not functional boundary guarantees. Use the stronger functional modifier or solid controls and check adjacent colours.
- Outline-only material provides no contrast protection over busy imagery. PNG/SVG overlays cannot perform live backdrop blur.
- The Mac repository and live landing page were not accessed or changed. This is a resource add-on only.

The manifest lists every package file except itself. See `IMPLEMENTATION_GUIDE.md` and `INTEGRATION_PROMPT.md` for practical integration.
