# Material / grain system

The 256 × 256 transparent PNG is a separately editable raster grain layer. It is clipped inside vector geometry; **the grain is not vector artwork**. Shapes, counters, gradients, masks and text remain editable. No SVG filters or blend modes are needed.

Approved opacity: 0.36 on logo/expressive symbols/64 px UI; 0.28 on artwork. Pattern scale per source unit: logo 1.5; expressive/artwork 0.9; large UI 0.7. The tile uses seed 2718, palette RGB values Espresso/Ivory and a varied alpha. Its standalone generation script is included and requires NumPy/Pillow.

Recipes in `gradient-recipes.json` specify every stop and direction. Warm = Ivory/Sand/Brown; Deep = Brown/Sand/Brown/Espresso; Quiet = mostly Ivory with Sand and a selective Grey edge. The logo’s light adaptation stays Espresso/Brown; its dark adaptation uses Ivory/Sand so no pale edge disappears on Ivory. Preserve the approved matte treatment; do not add a reflective centre band, gloss, blur or glow.

`Editable_Gradients` contains pure vector material fields; `Web_Exports` contains textured SVG/PNG/WebP fields; `Flat_Fallbacks` contains solid materials. These swatches supplement the applied assets. They are not the identity by themselves.

Use PNG at 2× the intended display size for consistent appearance. Do not enlarge the grain tile to create coarse static. Do not downsample a detailed full-size illustration into a tiny app icon. At 16–32 px use solid UI; at 48 px use simplified expressive forms. Textured expressive symbols begin at 72 px, preferred 96–192 px. The 64 px UI versions are for large display treatments, not tiny toolbars.

SVG grain is embedded for portability. SVGs ending `-gradient.svg`, `-mono.svg`, `-small.svg` and solid logos contain no raster grain. PNG/WebP is the reliable appearance fallback if an editor drops SVG patterns or clipping. Test an import before replacing native masters; cross-application import can vary.
