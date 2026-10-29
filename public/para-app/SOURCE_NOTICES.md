# PARA student runtime assets

Adapted from the user-supplied `PARA_App_Resource_Pack` version 1.0 for this locally authorised application redesign.

- `icons.svg`: selected symbols from `03_ICONS/Exports/para-ui-sprite.svg`. Original viewBoxes, currentColor strokes and geometry retained. Sources comprise existing PARA functional artwork and original functional gap artwork in the approved resource pack; no stock icon library.
- `para-environment-light.svg` / `para-environment-dark.svg`: unchanged original vectors from `04_BACKGROUNDS_AND_TEXTURES/Editable_Source/`.
- `grain.png`: unchanged supplied 256px procedural grain from `04_BACKGROUNDS_AND_TEXTURES/para-film-grain-256.png`.
- Existing `/brand/para-*.svg` logos are reused through BrandMark, not substituted or redrawn.
- Existing `/fonts/PlusJakartaSans-wght.woff2` and Be Vietnam Pro Regular/Medium/SemiBold are byte-identical to the pack. Font files remain in their existing location; the SIL Open Font Licence 1.1 notices are included here as `PlusJakartaSans-OFL.txt` and `BeVietnamPro-OFL.txt`.
- `styles/student/tokens.css` adapts supplied semantic tokens into the student scope. The material is the pack’s original CSS optical approximation (rim, tint, shadow, blur); it does not copy liquid-glass-react or React Bits rendering code.

Font provenance: https://github.com/tokotype/PlusJakartaSans and https://github.com/bettergui/BeVietnamPro. These links are provenance only; runtime assets are local. No private media or source design documents are included in runtime assets.
