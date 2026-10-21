# Delivery checks and remaining decisions

## Completed checks

- All four logo lockups match the original approved geometry. Path data and established transforms match across 60 geometry, colour, texture and optical-crop files.
- The three approved expressive specimens and English feedback artwork remain byte-identical to the approved review sources.
- 294 SVG files parse correctly, with unique IDs and resolved internal references. Production SVGs have no external raster dependencies.
- 289 PNG export records have validated dimensions and alpha channels. For 63 grain/gradient pairs, no transparency changes extend beyond the antialiased silhouette edge; opaque interiors remain opaque. Two outlined UI clips produce only tiny edge-rounding differences (maximum newly covered alpha 4/255).
- The final individual SVGs fit their viewBoxes. Superseded interim contact sheets were removed.
- All actual artwork and board text is covered by the bundled fonts. Vietnamese extended glyph coverage is complete. English and Vietnamese proofs were rendered and inspected.
- Overview, logo suite, both icon families, EN/VI learning artwork, material system and construction sheets were visually inspected. Compact UI controls were shown at realistic sizes.
- The eight-page Inkscape source retains named layers, vector geometry, editable gradients/text and separate raster grain.
- Catalogue links resolve to bundled files; its search and category-filter logic were checked. The catalogue is a local asset browser, not a website reference layout.
- Foundation colours and CSS/JSON colour tokens match. Functional contrast values are documented separately from decorative gradients.
- The ZIP is checked for CRC errors and contains every file listed in the checksum manifest.

Machine-readable details are in `quality-checks.json`, `bounds-check.json`, `catalogue-functional-check.json` and `export-register.json`.

## Remaining decisions

1. Choose an app-tile background and review the original versus simplified 16 px favicon. Files marked `PROPOSAL` are not replacements for the approved logo.
2. Select your real photographs and approve their crops when designing the landing page. No photograph has been created or processed here.
3. Proofread Vietnamese copy in its eventual context and keep labels accessible outside illustrations at smaller sizes.
4. Check import appearance in your chosen destination editor. Inkscape SVG is the supplied native source; Figma import and editing have not been verified. Use the supplied PNGs where an application drops SVG patterns or masks.

Grain remains raster material, not vector geometry. Artwork is conceptual; it does not imply automated assessment, measured results or available product-report features. The approved visual system has been extended without introducing a new logo concept.

The file manifest lists all package files except the manifest itself, which cannot contain its own stable checksum.
