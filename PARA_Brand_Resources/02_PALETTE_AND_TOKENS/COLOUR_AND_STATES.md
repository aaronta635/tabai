# Sandalwood / colour system

| Foundation | Hex | Role |
|---|---|---|
| Espresso | #3B2F2A | Essential text, strong silhouettes, dark fields |
| Saddle Brown | #8B5E34 | Warm detail, secondary text on Ivory, action hover |
| Sand | #D6B98C | Warm material planes, dark-surface accents |
| Ivory | #F3EDE2 | Quiet paper surfaces, reverse text |
| Cool Grey | #6B7280 | Selective material transitions; not small body text on Ivory |

Indicative overall mix: 45–60% Ivory, 20–30% Espresso, 10–20% Sand, 5–10% Brown, up to 5% Grey. These are ranges, not quantities that must sum in every image. Dark compositions can reverse Espresso/Ivory dominance. Use two or three stops per material where practical; do not force all five into each asset.

## Derived tokens

- Espresso Strong `#302722`: Espresso mixed with 18% black in encoded sRGB; pressed action state.
- Paper Soft `#F0E7D8`: Ivory mixed with 12% Sand in encoded sRGB; a quieter secondary surface.
- Border Strong `#726861`: Espresso mixed with 30% Ivory in encoded sRGB; functional boundaries.

Gradient intermediates and grain alpha composites are material rendering values, not new brand swatches. Monochrome artwork deliberately uses neutral grayscale `#141414, #555555, #777777, #BFBFBF, #F5F5F5` as a one-ink tonal simulation; do not reuse these as extra identity colours.

## Contrast, solid pairs

| Pair | Calculated contrast |
|---|---:|
| espresso on ivory | 11.08:1 |
| saddle-brown on ivory | 4.81:1 |
| espresso on sand | 6.87:1 |
| ivory on espresso | 11.08:1 |
| sand on espresso | 6.87:1 |
| cool-grey on ivory | 4.15:1 |
| saddle-brown on sand | 2.98:1 |

Normal reading text uses Espresso on Ivory/Sand or Ivory on Espresso. Brown on Ivory is 4.81:1 and can serve secondary reading text. Grey on Ivory is 4.15:1 and does not pass 4.5:1 for normal text. Brown on Sand is 2.98:1; do not use it for essential UI strokes or body text.

Textured assets are decorative/expressive. Functional text and essential compact controls must use solid semantic tokens. Brand gradients do not grant an accessibility exemption to controls.

## Interaction states

| State | Colour / behaviour |
|---|---|
| Default action | Espresso fill, Ivory text |
| Hover | Brown fill, Ivory text; subtle 120 ms colour transition |
| Pressed | Espresso Strong fill, Ivory text |
| Keyboard focus on light | 2 px Espresso ring, 3 px offset, visible on all sides |
| Keyboard focus on dark | 2 px Sand ring, 3 px offset |
| Selected | Espresso emphasis plus an underline/check; never colour alone |
| Disabled | Sand surface, Espresso label; native disabled semantics and no hover |
| Loading | Keep readable label plus “Loading…” / “Đang tải…”; prevent duplicate activation |
| Success | Check icon plus explicit text; Espresso on Ivory |
| Error / warning | Familiar error/warning icon, explicit problem and next step; Espresso on Ivory |

No unrelated red/green has been added. The icon and text distinguish status. Real application forms should use `aria-invalid`, associated error descriptions and appropriate live announcements. Controls need visible names, a 44 × 44 px recommended hit target, keyboard operation and a solid icon fallback.

Sources: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html and https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html . Contrast figures use the sRGB relative-luminance formula and are rounded for display; thresholds are checked unrounded.
