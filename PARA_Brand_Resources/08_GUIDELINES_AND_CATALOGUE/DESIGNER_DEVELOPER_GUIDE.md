# Designer / developer handoff

## Choose by purpose

| Need | Folder | Start with |
|---|---|---|
| Brand identifier | `01_LOGO` | Horizontal light/dark grain; solid at small sizes |
| Functional colour / type | `02_PALETTE_AND_TOKENS` | `para-tokens.css` + matching JSON |
| Font setup / language check | `03_TYPOGRAPHY` | `para-fonts.css` + bilingual proof |
| Explain a music-learning concept | `04_ICONS/Landing_and_Communication` | A labelled expressive symbol |
| Interactive control | `04_ICONS/Application_UI` | 24 px solid/reverse |
| Substantial learning story | `05_GRAPHIC_ARTWORK` | Appropriate EN/VI grain artwork |
| Reusable material | `06_GRADIENTS_AND_TEXTURES` | Recipe JSON + separate grain tile |
| Own real photographs | `07_PHOTOGRAPHY_GUIDANCE` | Read guide before applying overlays |
| Find or inspect an asset | `08_GUIDELINES_AND_CATALOGUE` | Local HTML catalogue / CSV registers |

## Source of truth

Open `00_START_HERE/PARA-native-master.svg` in Inkscape. It has eight pages and named layers. This is the equivalent native vector source; no Figma project has been created or claimed. Individual SVGs are authoritative reusable masters and also work as imports in other vector editors. Import fidelity for the grain pattern must be checked in the destination tool; use PNG if a destination strips patterns/masks.

Install the bundled fonts first. Text remains editable; the approved PARA wordmark remains paths. To recolour a gradient asset, edit named gradient stops, not individual noise pixels. Grain layer opacity is separate. Counters/negative spaces are transparent. No SVG noise filters, blend modes, remote images, JavaScript or external raster dependencies are required by production SVGs.

## Front-end implementation

Prefer SVG for solid logos/icons and gradient-only assets. Use supplied PNG/WebP for stable textured appearance when appropriate. Set explicit width/height or aspect ratio to avoid layout shift. Supply meaningful alt text only when the artwork adds meaning; decorative repeated illustrations should use empty alt text. Artwork register JSON provides short alt-text suggestions.

Keep essential labels, form text and small controls in solid semantic colours. Status needs an icon and words, not colour alone. Use the interaction guidance in `02_PALETTE_AND_TOKENS`. The package defines resources and behaviour guidance; it does not implement application state, backend logic, recording or a waitlist.

Use localised real text outside art when accessibility or responsive size requires it. Photographs remain landing-page-only. No generated photos are included.

## File conventions

All paths in registers are relative to the package root. `filename-use-register.csv` lists intended placement and source status. `file-manifest.csv` provides file bytes and checksums for completeness. Source and export stems match; PNG outputs use matching stems and live in documented export folders. In `04_ICONS`, PNGs sit beside their SVGs; in `01_LOGO` and `05_GRAPHIC_ARTWORK` they live under `PNG`.

## What is approved and what needs review

The exact logo geometry and initial grain treatment/three expressive icons/three controls/feedback artwork were approved. New family members extend that system. Only files explicitly marked `PROPOSAL` are alternative compact-mark adaptations that need a separate decision.

Remaining implementation decisions: app/favicon selection; final real-photo selection and crops; final localisation proofreading in context; destination-editor import check; screen-specific control labels and accessibility testing. The resource package does not assume unbuilt capabilities or guarantee student improvement.
