# Overlay and texture sources

| File family | Format | Purpose | Editing |
|---|---|---|---|
| `para-glass-rim-ivory/smoke` | SVG + 1280 × 800 RGBA PNG | Fine edge, quiet central transparency | Vector stroke, gradient stops and opacity |
| `para-glass-rising-edge-ivory/smoke` | SVG + PNG | Optional two-part rising highlight | Two deliberate path segments; editable weight/alpha |
| `para-glass-scrim-ivory/espresso` | SVG + PNG | Background separation if required | Colour/alpha stops; does not guarantee contrast |
| `para-glass-outline-ivory/espresso` | SVG + PNG | Transparent border resource without blur | Radius, stroke and colour |
| `para-film-grain-256.png` | Transparent PNG, 256 × 256 | Fine tactile layer repeated by CSS | Original procedural raster tile, unchanged |

The SVG overlay canvas is 640 × 400. PNG copies are 2× for reference/compositing. Each SVG has named editable layers and no embedded raster. `04_EDITABLE_SOURCE/overlay-construction.svg` combines rim and rising-edge geometry as independently toggleable layers. Do not non-uniformly stretch the standalone rim over radically different aspect ratios; prefer the live CSS border for responsive surfaces. Rising-edge overlay stretching affects a decorative detail only.

The grain tile is the original approved PARA material: deterministic seed 2718, Espresso/Ivory pixels with varied alpha. The glass system uses it at only 0.035–0.08 layer opacity; effective individual-pixel opacity is lower because the tile itself is transparent. It is not vector grain. Reuse the base package’s generator if regenerating it.

Live CSS backdrop blur is not included inside SVG or PNG overlays. These files add edges, separation or texture; static PNG previews only show a rendered example.
