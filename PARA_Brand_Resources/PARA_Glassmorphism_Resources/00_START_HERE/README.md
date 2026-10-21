# PARA Glassmorphism Resources / v1.0

A focused add-on to the approved PARA identity. The existing logo, icons and illustrations are unchanged. No landing page or product screen has been implemented.

## Open first

1. `../05_SPECIMENS/index.html` — local live material catalogue. Open directly after unzipping the entire folder. No server, installation, build step or internet connection is required.
2. `../05_SPECIMENS/previews/para-glass-overview.png` — static visual overview. PNGs show one rendered moment; they cannot blur whatever sits behind them later.
3. `../06_CODEX_HANDOFF/IMPLEMENTATION_GUIDE.md` — choose a material and integrate it correctly.
4. `../06_CODEX_HANDOFF/INTEGRATION_PROMPT.md` — ready for the next Codex session in your website repository.

## Materials

| Name | Class | Purpose |
|---|---|---|
| Ivory Frost | `para-glass--ivory` | Expressive warm glass over Sand and selected artwork |
| Espresso Smoke | `para-glass--smoke` | Dark glass over Espresso-led artwork; future photos require crop-specific checking |
| Quiet Glass | `para-glass--quiet` | Denser, calmer compact material; no blur or grain on mobile |

Each material has an opaque fallback. Essential text stays solid. Glass is selective presentation depth; it does not replace every surface in the brand.

## Folder map

- `01_TOKENS`: matching CSS and JSON, all properties prefixed `--para-glass-`.
- `02_EFFECTS_CSS`: live materials, layering, interaction states and accessibility fallbacks. Load both files in the documented order.
- `03_OVERLAYS_AND_TEXTURES`: eight editable transparent SVG overlays, 2× PNG copies and the original grain tile.
- `04_EDITABLE_SOURCE`: layered SVG construction and minimal HTML snippets. The live editable source is CSS + HTML, not a flattened image or a claimed Figma file.
- `05_SPECIMENS`: self-contained effects sheet, only the existing assets needed for demonstration, bundled fonts/licences and previews.
- `06_CODEX_HANDOFF`: implementation rules, integration prompt, asset/source registers and test results.

## Source and scope

The approved `PARA_Brand_Resources.zip` was recovered and inspected: logo, tokens, gradient recipes, texture, expressive symbols, learning artwork, typography and photography guidance. Its source files were not modified. Reused files are byte-checked against that package.

The local Mac repository is not accessible in this environment. This sibling folder is supplied for you to place beside `design-resources/PARA_Brand_Resources/` later. No repository or live website was changed. No real photograph was supplied, generated or processed.

Keep all relative paths when moving this add-on. If extracting only CSS, also copy its texture/overlay dependencies or update their URLs. The specimen JavaScript only controls the preview switches; the actual glass effects need no JavaScript.
