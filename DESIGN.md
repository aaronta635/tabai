---
# gstack: design-md-format=spec
name: PARA
colors:
  ivory: "#F3EDE2"
  paperSoft: "#F0E7D8"
  espresso: "#3B2F2A"
  espressoStrong: "#302722"
  saddle: "#8B5E34"
  sand: "#D6B98C"
  border: "#726861"
  onAction: "#F3EDE2"
typography:
  display:
    fontFamily: "Be Vietnam Pro"
    fontSize: "1.5rem"
    fontWeight: "600"
    lineHeight: "1.2"
    letterSpacing: "-0.02em"
    source: "local public/fonts/BeVietnamPro-*.woff2"
  body:
    fontFamily: "Be Vietnam Pro"
    fontSize: "1rem"
    fontWeight: "400"
    lineHeight: "1.5"
    source: "local public/fonts/BeVietnamPro-*.woff2"
  label:
    fontFamily: "Be Vietnam Pro"
    fontSize: "0.875rem"
    fontWeight: "500"
    lineHeight: "1.4"
  mono:
    fontFamily: "JetBrains Mono"
    fontSize: "0.75rem"
    fontWeight: "400"
    fontFeature: "tnum"
    source: "https://fonts.google.com/specimen/JetBrains+Mono"
rounded:
  none: "0px"
  control: "4px"
  panel: "8px"
  full: "999px"
spacing:
  base: "8px"
  xs: "4px"
  sm: "8px"
  lg: "24px"
  xl: "32px"
  navRow: "36px"
  rail: "240px"
  md: "16px"
components:
  buttonPrimary:
    background: "{colors.espresso}"
    color: "{colors.onAction}"
    rounded: "{rounded.control}"
    hover: "{colors.saddle}"
  rail:
    background: "{colors.paperSoft}"
    border: "{colors.sand}"
    width: "{spacing.rail}"
---

# PARA

Studio is an Operate-mode class desk for guitar teachers and students between live lessons. Landing is a separate room; see Marketing (Floot) below.

## Overview

PARA is a Next.js LMS: classes, curriculum, assignments, practice, takes, feedback. The first memory is a real class desk, not a marketing site and not Canvas blue. Teacher and student are separate doors. Light UI for daytime teaching. Original dog logo only.

Token source: Phase 3 verified fonts and PARA brand hexes. Mockup extraction was not applied.

## Colors

Sandalwood, from PARA_Brand_Resources: ivory ground, espresso text and actions, saddle for secondary text and hover, sand for warm planes. The Warm Signal file (raspberry, blush paper) is not the studio palette. No unrelated red or green. Status is espresso text plus an icon or a word.

## Typography

Be Vietnam Pro is the studio face for titles, labels, and controls, so a settings card does not mix a serif with a sans. JetBrains Mono is class codes, clocks, and wait labels. Plus Jakarta stays on the landing.

## Layout

Grid-disciplined. Left rail, one page title, lists and tables. Class context belongs in the rail or title, not a hero chip row. Hybrid: this file does not restyle marketing; the Marketing (Floot) section does.

## Elevation & Depth

No glass, glow, or stacked cards. Separation is a 1px sand or espresso line, and ivory vs paper-soft.

## Shapes

Controls 4px, panels 8px, no bubbly radius on every block.

## Components

Primary button: espresso fill, ivory text, saddle on hover. Tables for submissions, roster, work. Empty states: join or create a class. Login: espresso panel, ivory form, short copy.

## Do's and Don'ts

Do: class-first, one title, dog logo, EN/VI even type, role-separate login.
Don't: 3-column feature grids, nested cards, Plus Jakarta titles, manifesto-as-the-whole-login, purple, raspberry, blush paper, Inter.

## Marketing (Floot)

Scope: the Vietnamese pages `/vi`, `/vi/product`, `/vi/how-it-works`, `/vi/faq`. Source of truth is `design-reference/design-reference.md`; rules for agents are in `.cursor/rules/para-design.mdc`.

White, calm, Apple-minimal. Ink `#1d1d1f`, copper accent `#8b5e34`, surface `#f5f5f7`, hairline `#e5e5ea`, SF Pro with Inter as fallback, pill buttons, gradient icon tiles, macOS-style product window. Tokens live in `styles/site/marketing-tokens.css` and are scoped to `.para-marketing`, so the studio keeps Sandalwood and Be Vietnam Pro.

This supersedes the earlier Plus Jakarta landing for those four pages only. English pages and the older routes (`why-para`, `for-you`, `people`, `about`, legal pages) still use the legacy landing (`styles/site/para.css`) until their own pass. The nav links Sản phẩm, Cách hoạt động and Hỏi đáp; the older routes stay reachable but are not linked.
