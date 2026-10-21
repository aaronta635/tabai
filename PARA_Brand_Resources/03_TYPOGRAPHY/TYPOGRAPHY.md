# Typography / English and Vietnamese

Use **Plus Jakarta Sans 600** for headings and **Be Vietnam Pro 400** for body text; Be Vietnam Pro 500 for labels and 600 for emphasis. The logo remains custom vector artwork, not editable font text.

The original variable Jakarta font (200–800) and Be Vietnam Pro 400/500/600 TTF and WOFF2 files are included, with their unmodified SIL OFL 1.1 licences. Normal commercial design/web use and redistribution are covered by those licences; keep the licence files when redistributing fonts. The source repositories are https://github.com/tokotype/PlusJakartaSans and https://github.com/bettergui/BeVietnamPro .

| Role | Desktop | Mobile | Line height | Weight |
|---|---:|---:|---:|---:|
| Display | 64 | 40 | 1.30 | 600 |
| H1 | 48 | 32 | 1.35 | 600 |
| H2 | 36 | 28 | 1.40 | 600 |
| H3 | 26 | 22 | 1.40 | 600 |
| Body | 18 | 17 | 1.65 | 400 |
| Label | 14 | 14 | 1.50 | 500 |
| Caption | 12 | 12 | 1.50 | 400 |

Sizes are CSS pixels. Use the matching JSON/CSS tokens. Heading tracking −0.02em at most; relax to −0.01em or 0 for longer Vietnamese text. Body tracking stays 0. Headings usually fit 16–25 characters per line; body measure 50–65 characters. These are composition aids, not hard truncation limits.

Vietnamese text must have its own line breaks. Give stacked accents and descenders room; increase heading line height to 1.4 when needed. Do not force Vietnamese into the English line count or use all-uppercase long headings. Never fake a missing weight or fall back to an unrelated Vietnamese font.

The editable English/Vietnamese specimen includes all three requested pairs. The six artworks also have language-specific text versions. The artwork text is explanatory concept copy, not a claim that those product screens/features exist.

Install TTF fonts before opening native SVGs in Inkscape or another editor. For the web, include `para-fonts.css`; its paths point to bundled WOFF2 files. Essential reading text remains solid. The grain treatment is not applied to body typography.
