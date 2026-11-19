# PARA website — design reference (exported from the Floot prototype, 17 Nov 2026)

Purpose: a snapshot of the approved visual design so Cursor agents can reproduce it in the real site. Match these files; do not invent new colours, components or patterns.

Source of truth is the Floot preview. This file is a snapshot: re-export after every design change.

## How to use this file

1. Put this file in the repo as `design-reference/design-reference.md` (or split each block into its own file under `design-reference/`).
2. Add `.cursor/rules/para-design.mdc` (the rule text is in section 0 below).
3. In every Cursor task say: "Follow .cursor/rules/para-design.mdc and match design-reference/. Reuse the tokens and components. Do not add colours, shadows or components that are not here."

## Port notes (Floot prototype → Next.js on Vercel)

- The prototype is React + CSS Modules. Next.js supports CSS Modules natively, so the `.module.css` files port as they are.
- Move `base.css` into `app/globals.css` first. Everything else reads those CSS variables.
- Router: the prototype uses `react-router-dom` (`Link`, `NavLink`, `useLocation`). In Next use `next/link` and `usePathname()` for the active state. The scroll-to-top effect is not needed.
- `<title>` and `<meta>` inside page components become Next `metadata` exports.
- Icons: `lucide-react`.
- Not exported here, because they are Floot's built-in components: `Button`, `Input`, `Accordion`. Recreate them to this spec:
  - Button: pill (radius 9999px), sizes sm / md / lg (about 2.25rem / 2.75rem / 3.25rem high), primary = ink `#1d1d1f` fill with white text, outline = white fill with a hairline border `#e5e5ea`. Weight 600. No glow, no shadow, no colour.
  - Input: pill, 1px hairline border, white fill.
  - Accordion (variant "plain"): rows separated by hairlines, question in 600 weight, chevron on the right that rotates open, no card background.
  These values are approximate (I did not read Floot's source for them). Match them by eye against the preview.
- `helpers/useCallbackRef` (a tiny "stable callback" hook) is imported by `useScrollReveal` and was not exported; replace with `useCallback` or inline.
- Sample content ("Bin", "Thầy An", "3/4 ngày", tempo numbers) is invented illustration and is labelled "Ví dụ" / "Minh hoạ" on the page. Keep those labels.
- Team / people page, "Vì sao PARA" and "Dành cho bạn" pages were removed on purpose. Only Home, Sản phẩm, Cách hoạt động, Hỏi đáp exist.

---

## 0. `.cursor/rules/para-design.mdc`

```
---
description: PARA design system. Apply to every UI, page and component.
alwaysApply: true
---

# PARA design rules

Apple-minimal with a little play. Vietnamese-first. White, calm, centred.

## Language and voice
- UI copy is Vietnamese. "thầy cô" (never "giáo viên"), "bạn" for students, "con" for parents.
- Never write: nền tảng, giải pháp, tối ưu hoá, trải nghiệm, cá nhân hoá.
- Never promise "AI chấm bài" or "AI feedback". AI is behind the scenes; every comment comes from thầy cô.
- No prices, user counts, invented stats, leaderboards, or "theo dõi / giám sát" wording.
- Audio is enough. Camera off by default under 18. Recordings are the student's; sharing is opt-in.
- Any sample content (names, numbers) must be labelled "Ví dụ" or "Minh hoạ".

## Tokens (CSS variables in base.css, never hard-code)
- Text #1d1d1f, muted #6e6e73, background #ffffff, surface #f5f5f7, hairline #e5e5ea.
- Accent copper #8b5e34 (links, eyebrows, one gradient headline line). Primary button = ink #1d1d1f, white text.
- Radius: 8 / 12 / 18 / 28px; pills 9999px. Cards and blocks use 28px.
- Fonts: system stack first (-apple-system, "SF Pro Display/Text"), Inter fallback. Mono: ui-monospace, "SF Mono".
- Headings weight 700, tracking -0.035em to -0.04em, line-height 1.08-1.1. Body 17-19px, muted colour.
- Spring easing: cubic-bezier(0.34, 1.56, 0.64, 1).

## Components
- Nav: sticky, frosted (white 72% + saturate(180%) blur(20px)), 0.5px hairline, 13px links.
- Buttons: pill. Primary ink fill, secondary outline. NO glow, shadow or colour on buttons.
- Icons: lucide, strokeWidth 1.75, always inside gradient squircle tiles (blue, rose, copper, amber, green) with a white glyph. Never bare coloured icons.
- Product visuals: a macOS-style browser window (red/yellow/green dots, segmented tab control). Never phone mockups: PARA runs on the web.
- Sections: centred headings, generous whitespace, grey #f5f5f7 rounded blocks for emphasis (bento). Flat, hairline borders, no heavy shadows.
- Gradient glow is allowed ONLY behind the hero window and the final CTA card.
- Notebook ruled lines ONLY in the hero / page header, faded at the edges with a radial mask.
- Motion: reveal on scroll (fade + 22px rise + scale 0.97 with spring easing), tile hover lift. Respect prefers-reduced-motion.

## Pages
Home, Sản phẩm, Cách hoạt động, Hỏi đáp only. Do not add Vì sao PARA, Dành cho bạn or Con người.
Header: logo, 3 links, "Dùng thử miễn phí". Links collapse to a menu under 720px.

## Done means
Check at 390px, 768px and 1440px: no horizontal scroll, tap targets at least 44px, contrast AA.
```

---

## 1. `base.css` (design tokens → `app/globals.css`)

```css
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap");

:root {
  /* Overlay layers */
  --z-overlay: 400;

  --z-spotlight: 1000; /* Tutorial spotlights/guided help */

  /* System layers */
  --z-critical: 2000; /* Critical system notifications */

  /* spacing */
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-3: 0.75rem;
  --spacing-4: 1rem;
  --spacing-6: 1.5rem;
  --spacing-8: 2rem;
  --spacing-12: 3rem;
  --spacing-16: 4rem;
  --spacing-20: 5rem;
}

:root {
  --background: #ffffff;
  --foreground: #1d1d1f;

  --surface: #f5f5f7;
  --surface-foreground: #1d1d1f;
  --sidebar: #f5f5f7;
  --sidebar-foreground: #1d1d1f;
  --card: #ffffff;
  --card-foreground: #1d1d1f;
  --popup: #ffffff;
  --popup-foreground: #1d1d1f;

  --primary: #1d1d1f;
  --primary-foreground: #ffffff;
  --secondary: #e8e8ed;
  --secondary-foreground: #1d1d1f;
  --accent: #8b5e34;
  --accent-foreground: #ffffff;
  --muted: #f5f5f7;
  --muted-foreground: #6e6e73;

  --success: #248a3d;
  --success-foreground: #ffffff;
  --error: #d70015;
  --error-foreground: #ffffff;
  --warning: #b25000;
  --warning-foreground: #ffffff;
  --info: #0066cc;
  --info-foreground: #ffffff;
  --info-hover: #0058b0;
  --info-active: #004a94;

  --border: #e5e5ea;

  /* SF Pro on Apple devices, Inter everywhere else (both cover Vietnamese) */
  --font-family-base: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Segoe UI", system-ui, sans-serif;
  --font-family-display: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", system-ui, sans-serif;
  --font-family-monospace: ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace;
  --font-family-cursive: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", system-ui, sans-serif;

  --shadow: 0 1px 2px rgb(0 0 0 / 0.06);
  --shadow-md: 0 8px 30px rgb(0 0 0 / 0.08);
  --shadow-lg: 0 30px 60px -20px rgb(0 0 0 / 0.22);
  --shadow-focus: 0 0 0 4px rgb(139 94 52 / 0.2);

  --radius-sm: 8px;
  --radius: 12px;
  --radius-md: 18px;
  --radius-lg: 28px;
  --radius-full: 9999px;

  --animation-duration-fast: 140ms;
  --animation-duration-normal: 260ms;
  --animation-duration-slow: 700ms;
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

  --chart-color-1: #8b5e34;
  --chart-color-2: #1d1d1f;
  --chart-color-3: #248a3d;
  --chart-color-4: #b25000;
  --chart-color-5: #0066cc;

  /* product tokens */
  --paper-line: rgb(0 0 0 / 0.055);
  --copper-soft: #f6ece0;
}

.dark {
  --background: #000000;
  --foreground: #f5f5f7;
  --surface: #1d1d1f;
  --surface-foreground: #f5f5f7;
  --sidebar: #1d1d1f;
  --sidebar-foreground: #f5f5f7;
  --card: #1d1d1f;
  --card-foreground: #f5f5f7;
  --popup: #1d1d1f;
  --popup-foreground: #f5f5f7;
  --primary: #f5f5f7;
  --primary-foreground: #1d1d1f;
  --secondary: #2c2c2e;
  --secondary-foreground: #f5f5f7;
  --accent: #d19a62;
  --accent-foreground: #1d1d1f;
  --muted: #1d1d1f;
  --muted-foreground: #a1a1a6;
  --border: #38383a;
  --paper-line: rgb(255 255 255 / 0.07);
  --copper-soft: #3a2c1f;
}
```

---

## 2. `helpers/siteLinks.tsx`

```tsx
const APP = "https://www.paramuzic.com";

export const siteLinks = {
  app: APP,
  signup: `${APP}/vi/signup`,
  teacherLogin: `${APP}/vi/login/teacher`,
  studentLogin: `${APP}/vi/login/student`,
  classBase: `${APP}/c/`,
  privacy: `${APP}/vi/privacy`,
  terms: `${APP}/vi/terms`,
  dataDeletion: `${APP}/vi/data-deletion`,
  mail: "mailto:info@paramuzic.com",
  logo: `${APP}/brand/para/resources/para-horizontal-espresso-optical.svg`,
};
```

---

## 3. `helpers/faqItems.tsx`

```tsx
export interface FaqItem {
  q: string;
  a: string;
  /** Shown on the home page short list. */
  home?: boolean;
}

export const faqItems: FaqItem[] = [
  {
    q: "PARA là gì?",
    a: "PARA giúp thầy cô giao bài, nghe bài học viên gửi và hướng dẫn chỗ cần sửa giữa hai buổi học.",
  },
  {
    q: "PARA dành cho ai?",
    a: "PARA dành cho thầy cô dạy nhạc, học viên, và phụ huynh được thầy cô cho xem bài của con.",
  },
  {
    q: "PARA có thay thầy cô không?",
    a: "Không. Thầy cô vẫn giao bài, nghe bài và chỉ chỗ cần sửa. PARA giữ những việc đó giữa hai buổi học.",
    home: true,
  },
  {
    q: "AI có chấm bài của con tôi không?",
    a: "Không. AI chỉ giúp thầy cô nghe nhanh hơn. Không có nhận xét nào từ AI đến con mà chưa qua thầy cô.",
    home: true,
  },
  {
    q: "Học viên gửi bài tập thế nào?",
    a: "Học viên mở link trên điện thoại hoặc máy tính, chọn bản thu âm hoặc video đã có, rồi gửi đúng bài thầy cô đã giao.",
  },
  {
    q: "Học viên có cần tải ứng dụng không?",
    a: "Không. Mở link trên điện thoại hoặc máy tính là gửi được, không cần tải thêm gì.",
    home: true,
  },
  {
    q: "Ai xem được bản thu?",
    a: "Người thu và thầy cô. Phụ huynh chỉ xem khi được cho xem. Không công khai mặc định.",
    home: true,
  },
  {
    q: "Phụ huynh có thể xem gì?",
    a: "Phụ huynh được cho xem thì thấy bài con đang tập, góp ý của thầy cô, và con đã khá hơn chỗ nào. Thầy cô quyết định ai được xem. Phần này vẫn đang hoàn thiện.",
  },
  {
    q: "Có cần quay video không?",
    a: "Không bắt buộc. Bản thu âm là đủ. Camera tắt mặc định với học viên dưới 18 tuổi.",
  },
  {
    q: "Thầy cô của tôi chưa dùng PARA?",
    a: "Hãy nhắn thầy cô thử PARA. PARA bắt đầu từ thầy cô, không phải từ học viên. Thầy cô có thể dùng thử ngay bằng nút Dùng thử miễn phí.",
  },
  {
    q: "PARA có tính phí không?",
    a: "Hiện có phần dùng thử miễn phí. Giá sẽ được công bố khi chốt cùng các thầy cô đang dùng thử.",
    home: true,
  },
];
```

---

## 4. `components/GlowButton` (despite the name: a plain ink pill, NO glow)

`GlowButton.tsx`
```tsx
import React from "react";
import { Button } from "./Button";
import styles from "./GlowButton.module.css";

interface GlowButtonProps {
  href: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/** The one button with a gradient glow. Use only for the main call to action. */
export const GlowButton = ({ href, children, size = "md", className }: GlowButtonProps) => (
  <span className={`${styles.glow} ${className || ""}`}>
    <Button asChild size={size} shape="pill">
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    </Button>
  </span>
);
```

`GlowButton.module.css`
```css
/* Buttons carry no glow or colour of their own: plain ink pill. */
.glow {
  position: relative;
  display: inline-flex;
}
```

In the real site, name it `PrimaryButton`. It is the main call to action: ink pill, white text, no shadow.

---

## 5. `components/IconTile` (iOS-style squircle icon)

`IconTile.tsx`
```tsx
import React from "react";
import type { LucideIcon } from "lucide-react";
import styles from "./IconTile.module.css";

export type TileTone = "copper" | "amber" | "green" | "blue" | "rose";

interface IconTileProps {
  icon: LucideIcon;
  tone?: TileTone;
  size?: "md" | "sm";
}

/** iOS-style gradient squircle with a white glyph. */
export const IconTile = ({ icon: Icon, tone = "copper", size = "md" }: IconTileProps) => (
  <span className={`${styles.tile} ${styles[tone]} ${styles[size]}`} aria-hidden="true">
    <Icon strokeWidth={1.75} />
  </span>
);
```

`IconTile.module.css`
```css
.tile {
  display: inline-grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 26%;
  corner-shape: squircle;
  color: #fff;
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.4),
    inset 0 -1px 0 rgb(0 0 0 / 0.08),
    0 1px 2px rgb(0 0 0 / 0.12),
    0 8px 16px -8px var(--tile-glow);
  transition:
    transform 420ms var(--ease-spring),
    box-shadow 420ms ease;
}

.tile:hover {
  transform: translateY(-3px) scale(1.06);
}

.md {
  width: 3.5rem;
  height: 3.5rem;
}

.md svg {
  width: 1.65rem;
  height: 1.65rem;
}

.sm {
  width: 1.75rem;
  height: 1.75rem;
}

.sm svg {
  width: 1rem;
  height: 1rem;
}

.copper {
  background: linear-gradient(180deg, #d2995e, #8b5e34);
  --tile-glow: rgb(139 94 52 / 0.6);
}

.amber {
  background: linear-gradient(180deg, #ffc56b, #e08a1e);
  --tile-glow: rgb(224 138 30 / 0.55);
}

.green {
  background: linear-gradient(180deg, #6fd48a, #2f9e55);
  --tile-glow: rgb(47 158 85 / 0.5);
}

.blue {
  background: linear-gradient(180deg, #6db3ff, #2f6fdc);
  --tile-glow: rgb(47 111 220 / 0.5);
}

.rose {
  background: linear-gradient(180deg, #ff8f9e, #e0405a);
  --tile-glow: rgb(224 64 90 / 0.5);
}
```

---

## 6. `components/SiteShell` (frosted nav, footer, 3 links)

`SiteShell.tsx` (react-router version; port Link/NavLink to next/link + usePathname)
```tsx
import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { GlowButton } from "./GlowButton";
import { siteLinks } from "../helpers/siteLinks";
import styles from "./SiteShell.module.css";

const LINKS = [
  { to: "/product", label: "Sản phẩm" },
  { to: "/how-it-works", label: "Cách hoạt động" },
  { to: "/faq", label: "Hỏi đáp" },
];

export const SiteShell = ({ children }: { children: React.ReactNode }) => {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
    if (!window.location.hash) window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <a className={styles.skip} href="#main">
        Bỏ qua để đến nội dung chính
      </a>

      <header className={styles.nav}>
        <div className={styles.navInner}>
          <Link to="/" className={styles.logo} aria-label="PARA — trang chủ">
            <img src={siteLinks.logo} alt="PARA" height={28} />
          </Link>

          <nav className={styles.links} aria-label="Điều hướng chính">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `${styles.link} ${isActive ? styles.active : ""}`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className={styles.right}>
            <GlowButton href={siteLinks.signup}>Dùng thử miễn phí</GlowButton>
            <button
              type="button"
              className={styles.menuBtn}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Đóng trình đơn" : "Mở trình đơn"}
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {open && (
          <nav id="mobile-menu" className={styles.mobile} aria-label="Điều hướng chính">
            {LINKS.map((l) => (
              <Link key={l.to} to={l.to} className={styles.mobileLink}>
                {l.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main id="main" className={styles.main}>
        {children}
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <img src={siteLinks.logo} alt="PARA" height={24} />
            <p>Góp ý để sửa, không phải để chấm một lần thu.</p>
          </div>
          <nav className={styles.footerLinks} aria-label="Chân trang">
            <a href={siteLinks.mail}>Liên hệ</a>
            <a href={siteLinks.privacy} target="_blank" rel="noopener noreferrer">
              Quyền riêng tư
            </a>
            <a href={siteLinks.terms} target="_blank" rel="noopener noreferrer">
              Điều khoản
            </a>
            <a href={siteLinks.dataDeletion} target="_blank" rel="noopener noreferrer">
              Xóa dữ liệu
            </a>
          </nav>
        </div>
        <p className={styles.copy}>© 2026 PARA</p>
      </footer>
    </>
  );
};
```

`SiteShell.module.css`
```css
.skip {
  position: absolute;
  left: var(--spacing-4);
  top: -4rem;
  z-index: var(--z-critical);
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--radius);
  background: var(--primary);
  color: var(--primary-foreground);
}

.skip:focus {
  top: var(--spacing-3);
}

/* frosted glass bar */
.nav {
  position: sticky;
  top: 0;
  z-index: var(--z-overlay);
  border-bottom: 0.5px solid rgb(0 0 0 / 0.12);
  background: rgb(255 255 255 / 0.72);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
}

.navInner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-6);
  max-width: 72rem;
  margin-inline: auto;
  padding: 0.5rem var(--spacing-6);
}

.logo {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}

.logo img {
  display: block;
  height: 1.6rem;
  width: auto;
}

.links {
  display: flex;
  align-items: center;
  gap: var(--spacing-8);
}

.link {
  font-family: var(--font-family-base);
  font-size: 0.8125rem;
  font-weight: 400;
  letter-spacing: -0.01em;
  white-space: nowrap;
  color: rgb(29 29 31 / 0.8);
  text-decoration: none;
  transition: color var(--animation-duration-fast) ease;
}

.link:hover {
  color: var(--foreground);
}

.active {
  font-weight: 600;
  color: var(--foreground);
}

.right {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.menuBtn {
  display: none;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border: none;
  border-radius: var(--radius-full);
  background: var(--surface);
  color: var(--foreground);
  cursor: pointer;
}

.mobile {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-2) var(--spacing-6) var(--spacing-4);
  border-top: 0.5px solid rgb(0 0 0 / 0.1);
}

.mobileLink {
  padding: var(--spacing-3) 0;
  border-bottom: 0.5px solid rgb(0 0 0 / 0.1);
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--foreground);
  text-decoration: none;
}

.main {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-family-base);
  overflow-x: clip;
}

.footer {
  border-top: 0.5px solid rgb(0 0 0 / 0.12);
  background: var(--surface);
  font-family: var(--font-family-base);
}

.footerInner {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-8);
  max-width: 72rem;
  margin-inline: auto;
  padding: var(--spacing-12) var(--spacing-6) var(--spacing-6);
}

.footerBrand {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.footerBrand img {
  display: block;
  height: 1.4rem;
  width: auto;
}

.footerBrand p {
  margin: 0;
  max-width: 22rem;
  font-size: 0.8125rem;
  color: var(--muted-foreground);
}

.footerLinks {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-6);
  font-size: 0.8125rem;
}

.footerLinks a {
  color: var(--muted-foreground);
  text-decoration: none;
}

.footerLinks a:hover {
  color: var(--foreground);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.copy {
  max-width: 72rem;
  margin: 0 auto;
  padding: 0 var(--spacing-6) var(--spacing-8);
  font-size: 0.75rem;
  color: var(--muted-foreground);
}

@media (max-width: 720px) {
  .links {
    display: none;
  }

  .menuBtn {
    display: inline-flex;
  }
}

@media (max-width: 560px) {
  .navInner,
  .footerInner,
  .copy {
    padding-inline: var(--spacing-4);
  }

  .mobile {
    padding-inline: var(--spacing-4);
  }

  .footerInner {
    flex-direction: column;
  }
}
```

---

## 7. `components/Section`

`Section.tsx`
```tsx
import React from "react";
import styles from "./Section.module.css";

interface SectionProps {
  id?: string;
  eyebrow?: string;
  title?: string;
  sub?: string;
  children?: React.ReactNode;
}

export const Section = ({ id, eyebrow, title, sub, children }: SectionProps) => (
  <section id={id} className={styles.section}>
    <div className={styles.container}>
      {(eyebrow || title || sub) && (
        <div className={styles.head}>
          {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
          {title && <h2 className={styles.title}>{title}</h2>}
          {sub && <p className={styles.sub}>{sub}</p>}
        </div>
      )}
      {children}
    </div>
  </section>
);
```

`Section.module.css`
```css
.section {
  padding-block: clamp(3.5rem, 8vw, 6rem);
}

.container {
  width: 100%;
  max-width: 72rem;
  margin-inline: auto;
  padding-inline: var(--spacing-6);
}

.head {
  margin-bottom: var(--spacing-12);
  text-align: center;
}

.head:last-child {
  margin-bottom: 0;
}

.eyebrow {
  margin: 0 0 var(--spacing-3);
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--accent);
}

.title {
  margin: 0 auto;
  max-width: 44rem;
  font-family: var(--font-family-display);
  font-size: clamp(1.9rem, 3.8vw, 3rem);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.035em;
  text-wrap: balance;
}

.sub {
  margin: var(--spacing-4) auto 0;
  max-width: 36rem;
  font-size: 1.2rem;
  line-height: 1.5;
  color: var(--muted-foreground);
}

@media (max-width: 560px) {
  .container {
    padding-inline: var(--spacing-4);
  }
}
```

---

## 8. `components/PageHead` (inner-page header with faded notebook lines)

`PageHead.tsx`
```tsx
import React from "react";
import styles from "./PageHead.module.css";

interface PageHeadProps {
  eyebrow: string;
  title: string;
  lead?: string;
  visual?: React.ReactNode;
}

/** Top of every inner page. The only place the notebook lines appear besides the home hero. */
export const PageHead = ({ eyebrow, title, lead, visual }: PageHeadProps) => (
  <section className={styles.head}>
    <div className={`${styles.inner} ${visual ? styles.withVisual : ""}`}>
      <div className={styles.text}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 className={styles.title}>{title}</h1>
        {lead && <p className={styles.lead}>{lead}</p>}
      </div>
      {visual && <div className={styles.visual}>{visual}</div>}
    </div>
  </section>
);
```

`PageHead.module.css`
```css
.head {
  position: relative;
  overflow: hidden;
  padding-block: clamp(3.5rem, 8vw, 6rem) clamp(2rem, 4vw, 3rem);
  text-align: center;
}

/* notebook lines, faded at the edges */
.head::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: linear-gradient(var(--paper-line) 1px, transparent 1px);
  background-size: 100% 2.25rem;
  background-position: 0 0.9rem;
  -webkit-mask-image: radial-gradient(ellipse 70% 90% at 50% 0%, #000 30%, transparent 80%);
  mask-image: radial-gradient(ellipse 70% 90% at 50% 0%, #000 30%, transparent 80%);
  pointer-events: none;
}

.inner {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-12);
  max-width: 72rem;
  margin-inline: auto;
  padding-inline: var(--spacing-6);
}

.withVisual {
  gap: 3.5rem;
}

.eyebrow {
  margin: 0 0 var(--spacing-3);
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--accent);
}

.title {
  margin: 0 auto;
  max-width: 44rem;
  font-family: var(--font-family-display);
  font-size: clamp(2.2rem, 5vw, 3.9rem);
  font-weight: 700;
  line-height: 1.08;
  letter-spacing: -0.04em;
  text-wrap: balance;
}

.lead {
  margin: var(--spacing-6) auto 0;
  max-width: 36rem;
  font-size: 1.2rem;
  line-height: 1.5;
  color: var(--muted-foreground);
}

.visual {
  width: 100%;
  max-width: 52rem;
  min-width: 0;
}

@media (max-width: 560px) {
  .inner {
    padding-inline: var(--spacing-4);
  }
}
```

---

## 9. `components/StepList`

`StepList.tsx`
```tsx
import React from "react";
import styles from "./StepList.module.css";

interface StepListProps {
  items: { title: string; text?: string }[];
}

export const StepList = ({ items }: StepListProps) => (
  <ol className={styles.list}>
    {items.map((item, i) => (
      <li key={item.title} className={styles.item}>
        <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
        <h3 className={styles.title}>{item.title}</h3>
        {item.text && <p className={styles.text}>{item.text}</p>}
      </li>
    ))}
  </ol>
);
```

`StepList.module.css`
```css
.list {
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--foreground);
}

.item {
  display: grid;
  grid-template-columns: 3.5rem minmax(0, 15rem) minmax(0, 1fr);
  align-items: baseline;
  gap: var(--spacing-4);
  padding-block: var(--spacing-6);
  border-bottom: 1px solid var(--border);
}

.num {
  font-family: var(--font-family-monospace);
  font-size: 0.9rem;
  font-variant-numeric: tabular-nums;
  color: var(--accent);
}

.title {
  margin: 0;
  font-family: var(--font-family-display);
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.text {
  margin: 0;
  font-size: 1rem;
  line-height: 1.6;
  color: var(--muted-foreground);
}

@media (max-width: 720px) {
  .item {
    grid-template-columns: 2.5rem minmax(0, 1fr);
    row-gap: var(--spacing-1);
  }

  .text {
    grid-column: 2;
  }
}
```

---

## 10. `components/TryCta`

`TryCta.tsx`
```tsx
import React from "react";
import { GlowButton } from "./GlowButton";
import { siteLinks } from "../helpers/siteLinks";
import styles from "./TryCta.module.css";

export const TryCta = () => (
  <section className={styles.cta}>
    <div className={styles.inner}>
      <h2 className={styles.title}>Thử giao bài trên PARA.</h2>
      <GlowButton href={siteLinks.signup} size="lg">
        Dùng thử miễn phí
      </GlowButton>
    </div>
  </section>
);
```

`TryCta.module.css`
```css
.cta {
  padding-block: clamp(3.5rem, 8vw, 6rem);
  background: var(--surface);
}

.inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-8);
  max-width: 72rem;
  margin-inline: auto;
  padding-inline: var(--spacing-6);
  text-align: center;
}

.title {
  margin: 0;
  font-family: var(--font-family-display);
  font-size: clamp(1.9rem, 4vw, 3rem);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.035em;
}

@media (max-width: 560px) {
  .inner {
    padding-inline: var(--spacing-4);
  }
}
```

---

## 11. `components/AppWindow` (macOS-style browser window illustration)

`AppWindow.tsx`
```tsx
import React from "react";
import { Play } from "lucide-react";
import styles from "./AppWindow.module.css";

const BARS = Array.from({ length: 30 }, (_, i) =>
  Math.round(24 + Math.abs(Math.sin(i * 0.65) * 44 + Math.sin(i * 1.7) * 16)),
);
const MARKED = [13, 14, 15];

export const AppWindow = () => (
  <div
    className={styles.window}
    role="img"
    aria-label="Minh hoạ màn hình Hôm nay tập gì của học viên trên web PARA"
  >
    <div className={styles.chrome}>
      <span className={styles.dots} aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span className={styles.url}>paramuzic.com/student</span>
    </div>

    <div className={styles.tabs}>
      <span className={styles.tabActive}>Hôm nay</span>
      <span>Bài tập</span>
      <span>
        Góp ý <i className={styles.dot} />
      </span>
      <span>Tiến bộ</span>
    </div>

    <div className={styles.body}>
      <div className={styles.left}>
        <div className={styles.head}>
          <h3 className={styles.title}>Hôm nay tập gì</h3>
          <p className={styles.week}>
            Tuần này <span className={styles.mono}>3/4</span> ngày
            <span className={styles.weekDots} aria-hidden="true">
              <i className={styles.on} />
              <i className={styles.on} />
              <i className={styles.on} />
              <i />
            </span>
          </p>
        </div>

        <div className={`${styles.card} ${styles.cardActive}`}>
          <div className={styles.cardTop}>
            <h4 className={styles.cardTitle}>Đổi hợp âm C – G</h4>
            <span className={styles.chip}>3 bản thu</span>
          </div>
          <p className={styles.label}>Chỗ cần chú ý</p>
          <p className={styles.text}>
            Ô <span className={styles.mono}>5–8</span>: đổi hợp âm sớm hơn nửa nhịp.
          </p>
          <div className={styles.cardFoot}>
            <span className={styles.muted}>Thầy An · hôm qua</span>
            <span className={styles.cta}>Tập ngay</span>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTop}>
            <h4 className={styles.cardTitle}>Intro fingerstyle</h4>
            <span className={`${styles.chip} ${styles.chipNew}`}>Mới</span>
          </div>
          <p className={styles.muted}>Thầy giao hôm qua · chưa tập</p>
        </div>
      </div>

      <aside className={styles.right}>
        <p className={styles.label}>Góp ý mới</p>
        <p className={styles.byline}>Thầy An · hôm qua</p>

        <div className={styles.player}>
          <span className={styles.playBtn}>
            <Play size={12} />
          </span>
          <div className={styles.wave} aria-hidden="true">
            {BARS.map((h, i) => (
              <i
                key={i}
                className={MARKED.includes(i) ? styles.barMarked : undefined}
                style={{ height: `${h}%`, ["--i" as string]: i } as React.CSSProperties}
              />
            ))}
          </div>
          <span className={`${styles.mono} ${styles.time}`}>0:24</span>
        </div>

        <p className={styles.quote}>“Giữ nhịp đều trong đoạn này.”</p>

        <div className={styles.next}>
          <p className={styles.label}>Chỗ cần sửa lần sau</p>
          <p className={styles.text}>Luyện chậm đoạn này, rồi thu lại.</p>
        </div>
      </aside>
    </div>
  </div>
);
```

`AppWindow.module.css`
```css
.window {
  position: relative;
  width: 100%;
  overflow: hidden;
  border: 0.5px solid rgb(0 0 0 / 0.14);
  border-radius: var(--radius-lg);
  background: var(--card);
  color: var(--foreground);
  font-size: 0.82rem;
  line-height: 1.45;
  text-align: left;
  user-select: none;
}

.mono {
  font-family: var(--font-family-monospace);
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}

.muted {
  margin: 0;
  font-size: 0.76rem;
  color: var(--muted-foreground);
}

/* macOS-style window bar */
.chrome {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  padding: 0.75rem 1rem;
  border-bottom: 0.5px solid rgb(0 0 0 / 0.1);
  background: linear-gradient(180deg, #fbfbfc, #f2f2f4);
}

.dots {
  display: inline-flex;
  gap: 0.4rem;
}

.dots i {
  width: 0.7rem;
  height: 0.7rem;
  border-radius: var(--radius-full);
  box-shadow: inset 0 0 0 0.5px rgb(0 0 0 / 0.15);
}

.dots i:nth-child(1) {
  background: #ff5f57;
}

.dots i:nth-child(2) {
  background: #febc2e;
}

.dots i:nth-child(3) {
  background: #28c840;
}

.url {
  flex: 1;
  max-width: 17rem;
  padding: 0.22rem 0.8rem;
  border-radius: var(--radius-sm);
  background: rgb(0 0 0 / 0.05);
  font-size: 0.72rem;
  text-align: center;
  color: var(--muted-foreground);
}

/* segmented control */
.tabs {
  display: inline-flex;
  gap: 2px;
  margin: 1rem 1.25rem 0;
  padding: 3px;
  border-radius: var(--radius-full);
  background: var(--surface);
  font-size: 0.76rem;
  font-weight: 500;
  color: var(--muted-foreground);
}

.tabs span {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.28rem 0.85rem;
  border-radius: var(--radius-full);
}

.tabActive {
  background: var(--card);
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.14);
  color: var(--foreground);
}

.dot {
  width: 0.42rem;
  height: 0.42rem;
  border-radius: var(--radius-full);
  background: #ff3b30;
}

/* body */
.body {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  gap: var(--spacing-4);
  padding: 1.1rem 1.25rem 1.25rem;
}

.left {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.head {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.title {
  margin: 0;
  font-family: var(--font-family-display);
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.week {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 0.76rem;
  color: var(--muted-foreground);
}

.weekDots {
  display: inline-flex;
  gap: 0.25rem;
}

.weekDots i {
  width: 0.7rem;
  height: 0.7rem;
  border: 1.5px solid #d2d2d7;
  border-radius: var(--radius-full);
}

.weekDots i.on {
  border-color: transparent;
  background: linear-gradient(180deg, #d2995e, #8b5e34);
}

.card {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0.85rem 0.95rem;
  border-radius: var(--radius-md);
  background: var(--surface);
}

.cardActive {
  background: var(--card);
  box-shadow:
    0 0 0 0.5px rgb(0 0 0 / 0.1),
    0 6px 18px -8px rgb(0 0 0 / 0.18);
}

.cardTop {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.cardTitle {
  margin: 0;
  font-family: var(--font-family-display);
  font-size: 0.92rem;
  font-weight: 600;
  letter-spacing: -0.015em;
}

.chip {
  padding: 0.1rem 0.5rem;
  border-radius: var(--radius-full);
  background: rgb(0 0 0 / 0.06);
  font-size: 0.68rem;
  font-weight: 500;
  white-space: nowrap;
  color: var(--muted-foreground);
}

.chipNew {
  background: var(--copper-soft);
  color: var(--accent);
  font-weight: 600;
}

.label {
  margin: 0.1rem 0 0;
  font-size: 0.64rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent);
}

.text {
  margin: 0;
  font-size: 0.82rem;
}

.cardFoot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: 0.3rem;
  padding-top: 0.55rem;
  border-top: 0.5px solid rgb(0 0 0 / 0.1);
}

.cta {
  padding: 0.32rem 0.9rem;
  border-radius: var(--radius-full);
  background: var(--primary);
  color: var(--primary-foreground);
  font-size: 0.74rem;
  font-weight: 600;
  white-space: nowrap;
}

/* feedback panel */
.right {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 1rem;
  border-radius: var(--radius-md);
  background: var(--surface);
}

.byline {
  margin: -0.35rem 0 0;
  font-size: 0.74rem;
  color: var(--muted-foreground);
}

.player {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.7rem;
  border-radius: var(--radius);
  background: var(--card);
  box-shadow: 0 0 0 0.5px rgb(0 0 0 / 0.08);
}

.playBtn {
  display: grid;
  place-items: center;
  width: 1.7rem;
  height: 1.7rem;
  flex-shrink: 0;
  border-radius: var(--radius-full);
  background: linear-gradient(180deg, #d2995e, #8b5e34);
  color: var(--accent-foreground);
}

.wave {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 2px;
  height: 2rem;
  min-width: 0;
  overflow: hidden;
}

.wave i {
  flex: 1;
  min-width: 1px;
  border-radius: 1px;
  background: rgb(0 0 0 / 0.22);
  transform-origin: center;
}

.wave i.barMarked {
  background: var(--accent);
}

@media (prefers-reduced-motion: no-preference) {
  .wave i {
    animation: pulse 1.6s ease-in-out infinite;
    animation-delay: calc(var(--i) * -90ms);
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scaleY(1);
  }
  50% {
    transform: scaleY(0.55);
  }
}

.time {
  font-size: 0.72rem;
  color: var(--muted-foreground);
}

.quote {
  margin: 0.2rem 0 0;
  font-family: var(--font-family-display);
  font-size: 1.05rem;
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: -0.02em;
}

.next {
  margin-top: auto;
  padding-top: 0.6rem;
  border-top: 0.5px solid rgb(0 0 0 / 0.1);
}

@media (max-width: 560px) {
  .body {
    grid-template-columns: minmax(0, 1fr);
    padding: 1rem;
  }

  .tabs {
    margin-inline: 1rem;
    max-width: calc(100% - 2rem);
    overflow-x: auto;
  }
}
```

---

## 12. `components/ClassCodeForm` (as built; the monospace input is known to look off, open item)

`ClassCodeForm.tsx`
```tsx
import React, { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Input } from "./Input";
import { Button } from "./Button";
import styles from "./ClassCodeForm.module.css";

const CLASS_URL = "https://www.paramuzic.com/c/";

export const ClassCodeForm = ({ className }: { className?: string }) => {
  const [code, setCode] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    window.open(`${CLASS_URL}${encodeURIComponent(trimmed)}`, "_blank", "noopener");
  };

  return (
    <form className={`${styles.form} ${className || ""}`} onSubmit={submit}>
      <label className={styles.label} htmlFor="class-code">
        Đã có mã lớp từ thầy cô?
      </label>
      <div className={styles.row}>
        <Input
          id="class-code"
          className={styles.input}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Nhập mã lớp"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
        />
        <Button type="submit" variant="outline" shape="pill" disabled={!code.trim()}>
          Vào lớp <ArrowRight />
        </Button>
      </div>
    </form>
  );
};
```

`ClassCodeForm.module.css`
```css
.form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  width: 100%;
  max-width: 24rem;
}

.label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--muted-foreground);
}

.row {
  display: flex;
  gap: var(--spacing-2);
}

.input {
  flex: 1;
  min-width: 0;
  border-radius: var(--radius-full);
  padding-inline: var(--spacing-4);
  font-family: var(--font-family-monospace);
  letter-spacing: 0.04em;
}
```

---

## 13. `helpers/useScrollReveal.tsx` (scroll reveal)

Behaviour: returns a callback ref. When the element enters the viewport, it sets `data-revealed="true"` on it and all descendants; CSS does the animation. Respects `prefers-reduced-motion` (reveals at once). Threshold 0.15, rootMargin `0px 0px -40px 0px`. In Next, implement with IntersectionObserver in a small client hook; the CSS contract matters, not the code:

```css
/* element starts hidden */
.reveal { opacity: 0; transform: translateY(22px) scale(0.97);
  transition: opacity 700ms ease, transform 700ms var(--ease-spring); }
/* hook sets data-revealed="true" */
.reveal[data-revealed="true"] { opacity: 1; transform: none; }
```

---

## 14. `pages/_index.tsx` (Home)

```tsx
import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ClipboardList,
  Mic,
  Headphones,
  Repeat,
  TrendingUp,
  Check,
  Play,
} from "lucide-react";
import { Button } from "../components/Button";
import { GlowButton } from "../components/GlowButton";
import { SiteShell } from "../components/SiteShell";
import { ClassCodeForm } from "../components/ClassCodeForm";
import { AppWindow } from "../components/AppWindow";
import { IconTile, TileTone } from "../components/IconTile";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "../components/Accordion";
import { useScrollReveal } from "../helpers/useScrollReveal";
import { faqItems } from "../helpers/faqItems";
import { siteLinks } from "../helpers/siteLinks";
import styles from "./_index.module.css";

const STEPS: {
  icon: typeof Mic;
  tone: TileTone;
  title: string;
  text: string;
}[] = [
  {
    icon: ClipboardList,
    tone: "blue",
    title: "Giao bài",
    text: "Thầy cô giao bài qua một đường link.",
  },
  {
    icon: Mic,
    tone: "rose",
    title: "Tập và thu",
    text: "Thu nhiều lần, chọn bản tốt nhất để gửi.",
  },
  {
    icon: Headphones,
    tone: "copper",
    title: "Góp ý",
    text: "Thầy cô góp ý đúng đoạn, đúng ô nhịp.",
  },
  {
    icon: Repeat,
    tone: "amber",
    title: "Tập lại",
    text: "Sửa đúng chỗ, thu bản mới.",
  },
  {
    icon: TrendingUp,
    tone: "green",
    title: "Tiến bộ",
    text: "Mỗi bản thu được giữ lại để nghe lại.",
  },
];

const TRUST = [
  "Ghi âm là đủ, không cần bật camera",
  "Camera tắt mặc định với học viên dưới 18 tuổi",
  "Bạn chọn bản thu nào gửi đi",
  "Chia sẻ cần đồng ý, không công khai mặc định",
  "Không bảng xếp hạng",
  "Phụ huynh thấy tiến bộ, không thấy số lần mở app",
];

const HOME_FAQ = faqItems.filter((f) => f.home);

const IndexPage = () => {
  const revealSteps = useScrollReveal();
  const revealNote = useScrollReveal();
  const revealTrust = useScrollReveal();
  const revealFaq = useScrollReveal();
  const revealFinal = useScrollReveal();

  return (
    <SiteShell>
      <title>PARA — Tập có hướng dẫn giữa hai buổi học</title>
      <meta
        name="description"
        content="PARA giúp bạn biết cần tập gì, biết cần sửa gì và thấy mình tiến bộ — cùng thầy cô của mình."
      />

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroText}>
            <p className={styles.eyebrow}>Tập giữa hai buổi học</p>
            <h1 className={styles.h1}>
              <span className={styles.line}>Biết cần tập gì.</span>
              <span className={styles.line}>Biết cần sửa gì.</span>
              <span className={styles.hl}>Thấy mình tiến bộ.</span>
            </h1>
            <p className={styles.lead}>
              Buổi học chỉ có một giờ. Tiến bộ nằm ở những ngày còn lại. PARA giúp bạn tập
              giữa hai buổi, cùng thầy cô của mình.
            </p>
            <p className={styles.teacherLine}>
              <IconTile icon={Headphones} tone="copper" size="sm" />
              <span>
                <strong>Thầy cô:</strong> giao bài một lần, nghe đúng chỗ cần nghe.
              </span>
            </p>
            <div className={styles.ctas}>
              <GlowButton href={siteLinks.signup} size="lg">
                Dùng thử miễn phí
              </GlowButton>
              <Button asChild size="lg" shape="pill" variant="outline">
                <a href={siteLinks.teacherLogin} target="_blank" rel="noopener noreferrer">
                  Tôi là thầy cô
                </a>
              </Button>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.windowGlow}>
              <AppWindow />
            </div>
            <p className={styles.illus}>Minh hoạ giao diện</p>
          </div>
        </div>
      </section>

      {/* LOOP */}
      <section id="cach-hoat-dong" className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <p className={styles.eyebrow}>Cách hoạt động</p>
            <h2 className={styles.h2}>Một vòng đơn giản.</h2>
          </div>
          <div ref={revealSteps} className={`${styles.steps} ${styles.stagger}`}>
            {STEPS.map((s, i) => (
              <div key={s.title} className={styles.step}>
                <IconTile icon={s.icon} tone={s.tone} />
                <span className={styles.stepIdx}>{String(i + 1).padStart(2, "0")}</span>
                <h3 className={styles.stepTitle}>{s.title}</h3>
                <p className={styles.stepText}>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PARENT NOTE */}
      <section id="phu-huynh" className={styles.section}>
        <div className={`${styles.container} ${styles.noteGrid}`}>
          <div className={styles.noteText}>
            <p className={styles.eyebrow}>Cho phụ huynh · đang hoàn thiện</p>
            <h2 className={styles.h2Left}>Một tin ngắn mỗi tuần. Không phải bảng chấm công.</h2>
            <p className={styles.subLeft}>
              Con đang học gì, đã khá hơn ở đâu, thầy cô nói gì. Tin luôn mang lời của thầy
              cô.
            </p>
          </div>

          <div ref={revealNote} className={styles.noteReveal}>
            <div className={styles.note}>
              <span className={styles.noteStamp}>Ví dụ</span>
              <h3 className={styles.noteTitle}>Tuần này của Bin</h3>
              <dl className={styles.noteList}>
                <div>
                  <dt>Đang học</dt>
                  <dd>Chuyển hợp âm C–G.</dd>
                </div>
                <div>
                  <dt>Đã khá hơn</dt>
                  <dd>Chuyển hợp âm mượt hơn tuần trước, không còn khựng ở ô 5–8.</dd>
                </div>
                <div>
                  <dt>Thầy An nói</dt>
                  <dd className={styles.quote}>
                    “Giữ nhịp tốt rồi. Tuần sau tập chậm lại đoạn điệp khúc.”
                  </dd>
                </div>
                <div>
                  <dt>Tập đều</dt>
                  <dd>4 ngày trong tuần, dành nhiều nhất cho đoạn chuyển hợp âm.</dd>
                </div>
              </dl>
              <div className={styles.noteFoot}>
                <span>
                  <Play size={12} /> Nghe bản thu tuần này
                </span>
                <span>
                  <Play size={12} /> Nghe lại bản tuần trước
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST (compact) */}
      <section id="niem-tin" className={styles.trust}>
        <div className={styles.container}>
          <div className={styles.trustCard}>
            <div>
              <h2 className={styles.h2Small}>Bản thu là của bạn.</h2>
              <p className={styles.trustSub}>Bạn chọn gửi gì, và ai được xem.</p>
            </div>
            <ul ref={revealTrust} className={`${styles.trustList} ${styles.stagger}`}>
              {TRUST.map((t) => (
                <li key={t}>
                  <span className={styles.tick}>
                    <Check size={12} strokeWidth={3} aria-hidden="true" />
                  </span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="hoi-dap" className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <p className={styles.eyebrow}>Hỏi đáp</p>
            <h2 className={styles.h2}>Câu hỏi thường gặp.</h2>
          </div>
          <div ref={revealFaq} className={styles.faq}>
            <Accordion type="single" collapsible variant="plain">
              {HOME_FAQ.map((f, i) => (
                <AccordionItem key={f.q} value={`item-${i}`}>
                  <AccordionTrigger>{f.q}</AccordionTrigger>
                  <AccordionContent>{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            <Link to="/faq" className={styles.more}>
              Xem tất cả câu hỏi <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.finalWrap}>
            <div ref={revealFinal} className={styles.final}>
              <h2 className={styles.finalTitle}>Giao bài. Nghe bài. Góp ý.</h2>
              <div className={styles.finalCta}>
                <GlowButton href={siteLinks.signup} size="lg">
                  Dùng thử miễn phí
                </GlowButton>
              </div>
              <ClassCodeForm className={styles.finalCode} />
              <p className={styles.finalLinks}>
                <a href={siteLinks.teacherLogin} target="_blank" rel="noopener noreferrer">
                  Tôi là thầy cô
                </a>
                <span aria-hidden="true">·</span>
                <a href={siteLinks.studentLogin} target="_blank" rel="noopener noreferrer">
                  Tôi là học viên
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
};

export default IndexPage;
```

`_index.module.css`
```css
/* ---------- base ---------- */
.container {
  position: relative;
  width: 100%;
  max-width: 72rem;
  margin-inline: auto;
  padding-inline: var(--spacing-6);
}

.eyebrow {
  margin: 0 0 var(--spacing-3);
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--accent);
}

.h2 {
  margin: 0 auto;
  max-width: 44rem;
  font-family: var(--font-family-display);
  font-size: clamp(1.9rem, 3.8vw, 3rem);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.035em;
  text-wrap: balance;
}

.h2Left {
  margin: 0;
  font-family: var(--font-family-display);
  font-size: clamp(1.9rem, 3.8vw, 3rem);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.035em;
  text-wrap: balance;
}

.h2Small {
  margin: 0;
  font-family: var(--font-family-display);
  font-size: clamp(1.5rem, 2.6vw, 2rem);
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.03em;
}

.subLeft {
  margin: var(--spacing-4) 0 0;
  max-width: 32rem;
  font-size: 1.2rem;
  line-height: 1.5;
  color: var(--muted-foreground);
}

.section {
  padding-block: clamp(4rem, 9vw, 7rem);
}

.sectionHead {
  margin-bottom: var(--spacing-12);
  text-align: center;
}

/* ---------- reveal (spring pop) ---------- */
.stagger > *,
.noteReveal,
.faq,
.final {
  opacity: 0;
  transform: translateY(22px) scale(0.97);
  transition:
    opacity var(--animation-duration-slow) ease,
    transform var(--animation-duration-slow) var(--ease-spring);
}

.stagger > *[data-revealed="true"],
.noteReveal[data-revealed="true"],
.faq[data-revealed="true"],
.final[data-revealed="true"] {
  opacity: 1;
  transform: none;
}

.stagger > *:nth-child(2) {
  transition-delay: 70ms;
}
.stagger > *:nth-child(3) {
  transition-delay: 140ms;
}
.stagger > *:nth-child(4) {
  transition-delay: 210ms;
}
.stagger > *:nth-child(5) {
  transition-delay: 280ms;
}
.stagger > *:nth-child(6) {
  transition-delay: 350ms;
}

/* ---------- gradient glow (hero visual and final card only) ---------- */
.windowGlow {
  position: relative;
  width: 100%;
}

.windowGlow::before {
  content: "";
  position: absolute;
  inset: 18% -4% -8% -4%;
  border-radius: 3rem;
  background: linear-gradient(135deg, rgb(139 94 52 / 0.36), rgb(255 143 158 / 0.24) 55%, rgb(109 179 255 / 0.22));
  filter: blur(46px);
}

.finalWrap {
  position: relative;
}

.finalWrap::before {
  content: "";
  position: absolute;
  inset: 30% 6% -8% 6%;
  border-radius: 3rem;
  background: linear-gradient(120deg, rgb(139 94 52 / 0.3), rgb(255 197 107 / 0.3) 50%, rgb(255 143 158 / 0.22));
  filter: blur(42px);
}

/* ---------- hero (notebook lines live here only, faded) ---------- */
.hero {
  position: relative;
  overflow: hidden;
  padding-block: clamp(3.5rem, 8vw, 6rem) clamp(3rem, 6vw, 5rem);
}

.hero::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: linear-gradient(var(--paper-line) 1px, transparent 1px);
  background-size: 100% 2.25rem;
  background-position: 0 0.9rem;
  -webkit-mask-image: radial-gradient(ellipse 70% 80% at 50% 0%, #000 30%, transparent 80%);
  mask-image: radial-gradient(ellipse 70% 80% at 50% 0%, #000 30%, transparent 80%);
  pointer-events: none;
}

.heroInner {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3.5rem;
  max-width: 72rem;
  margin-inline: auto;
  padding-inline: var(--spacing-6);
  text-align: center;
}

.heroText {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 46rem;
}

.h1 {
  margin: 0;
  font-family: var(--font-family-display);
  font-size: clamp(2.4rem, 5.4vw, 4.4rem);
  font-weight: 700;
  line-height: 1.08;
  letter-spacing: -0.04em;
}

.line {
  display: block;
}

.hl {
  display: inline;
  white-space: nowrap;
  padding-bottom: 0.08em;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
  background: linear-gradient(90deg, #8b5e34, #e0a36b 55%, #c4794a);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}

.lead {
  margin: var(--spacing-6) 0 0;
  max-width: 34rem;
  font-size: 1.3rem;
  line-height: 1.5;
  color: var(--muted-foreground);
}

.teacherLine {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  margin: var(--spacing-6) 0 0;
  padding: 0.4rem 1rem 0.4rem 0.45rem;
  border-radius: var(--radius-full);
  background: var(--surface);
  font-size: 0.95rem;
  text-align: left;
}

.ctas {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-4);
  margin-top: var(--spacing-8);
}

.heroVisual {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-4);
  width: 100%;
  max-width: 52rem;
}

.illus {
  margin: 0;
  font-size: 0.75rem;
  color: var(--muted-foreground);
}

@media (prefers-reduced-motion: no-preference) {
  .heroText > * {
    animation: rise 800ms var(--ease-spring) both;
  }
  .heroText > *:nth-child(2) {
    animation-delay: 70ms;
  }
  .heroText > *:nth-child(3) {
    animation-delay: 140ms;
  }
  .heroText > *:nth-child(4) {
    animation-delay: 200ms;
  }
  .heroText > *:nth-child(5) {
    animation-delay: 260ms;
  }
  .heroVisual {
    animation: rise 1000ms 240ms var(--ease-spring) both;
  }
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(24px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

/* ---------- loop ---------- */
.steps {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: var(--spacing-6);
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-2);
  text-align: center;
}

.stepIdx {
  margin-top: var(--spacing-3);
  font-family: var(--font-family-monospace);
  font-size: 0.75rem;
  color: var(--muted-foreground);
}

.stepTitle {
  margin: 0;
  font-family: var(--font-family-display);
  font-size: 1.2rem;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.stepText {
  margin: 0;
  max-width: 13rem;
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--muted-foreground);
}

/* ---------- parent note ---------- */
.noteGrid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 26rem);
  align-items: center;
  gap: var(--spacing-16);
}

.noteReveal {
  display: flex;
  justify-content: center;
}

.note {
  position: relative;
  width: 100%;
  padding: var(--spacing-8) var(--spacing-6) var(--spacing-6);
  border-radius: var(--radius-lg);
  background-color: var(--card);
  box-shadow:
    0 0 0 0.5px rgb(0 0 0 / 0.1),
    var(--shadow-md);
  transform: rotate(-1.2deg);
  transition: transform 500ms var(--ease-spring);
}

.note:hover {
  transform: rotate(0deg) scale(1.01);
}

.noteStamp {
  position: absolute;
  top: var(--spacing-4);
  right: var(--spacing-4);
  padding: 0.2rem 0.7rem;
  border-radius: var(--radius-full);
  background: var(--copper-soft);
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--accent);
}

.noteTitle {
  margin: 0 0 var(--spacing-4);
  font-family: var(--font-family-display);
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.noteList {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  margin: 0;
}

.noteList dt {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--accent);
}

.noteList dd {
  margin: 0.15rem 0 0;
  font-size: 1rem;
  line-height: 1.5;
}

.quote {
  font-family: var(--font-family-display);
  font-weight: 600;
}

.noteFoot {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-3);
  margin-top: var(--spacing-6);
  padding-top: var(--spacing-4);
  border-top: 0.5px solid rgb(0 0 0 / 0.12);
  font-size: 0.8rem;
  font-weight: 500;
}

.noteFoot span {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.75rem;
  border-radius: var(--radius-full);
  background: var(--surface);
}

.noteFoot svg {
  color: var(--accent);
}

/* ---------- trust (compact bento block) ---------- */
.trust {
  padding-block: clamp(1rem, 3vw, 2rem);
}

.trustCard {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  align-items: center;
  gap: var(--spacing-12);
  padding: clamp(1.75rem, 4vw, 3rem);
  border-radius: var(--radius-lg);
  background: var(--surface);
}

.trustSub {
  margin: var(--spacing-2) 0 0;
  color: var(--muted-foreground);
}

.trustList {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--spacing-3) var(--spacing-8);
  margin: 0;
  padding: 0;
  list-style: none;
}

.trustList li {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-3);
  font-size: 0.95rem;
  line-height: 1.45;
}

.tick {
  display: inline-grid;
  place-items: center;
  flex-shrink: 0;
  width: 1.2rem;
  height: 1.2rem;
  margin-top: 0.1rem;
  border-radius: var(--radius-full);
  background: linear-gradient(180deg, #6fd48a, #2f9e55);
  color: #fff;
}

/* ---------- FAQ ---------- */
.faq {
  max-width: 48rem;
  margin-inline: auto;
}

.more {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
  margin-top: var(--spacing-6);
  font-size: 1rem;
  font-weight: 500;
  color: var(--accent);
  text-decoration: none;
}

.more svg {
  transition: transform 300ms var(--ease-spring);
}

.more:hover svg {
  transform: translateX(4px);
}

/* ---------- final ---------- */
.final {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: clamp(2.5rem, 6vw, 4.5rem) var(--spacing-6);
  border-radius: var(--radius-lg);
  background-color: var(--surface);
  text-align: center;
}

.finalTitle {
  margin: 0;
  font-family: var(--font-family-display);
  font-size: clamp(2rem, 4.8vw, 3.5rem);
  font-weight: 700;
  line-height: 1.08;
  letter-spacing: -0.04em;
  text-wrap: balance;
}

.finalCta {
  display: flex;
  justify-content: center;
  margin-top: var(--spacing-8);
}

.finalCode {
  margin-top: var(--spacing-8);
  align-items: center;
  text-align: center;
}

.finalLinks {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  margin: var(--spacing-6) 0 0;
  font-size: 0.9rem;
  color: var(--muted-foreground);
}

.finalLinks a {
  color: var(--accent);
  text-decoration: none;
}

.finalLinks a:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

/* ---------- responsive ---------- */
@media (max-width: 960px) {
  .hl {
    white-space: normal;
  }

  .steps {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--spacing-6);
  }

  .step {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-areas:
      "tile idx"
      "tile title"
      "tile text";
    align-items: center;
    column-gap: var(--spacing-4);
    row-gap: 0;
    text-align: left;
  }

  .step > span:first-child {
    grid-area: tile;
  }

  .stepIdx {
    grid-area: idx;
    margin-top: 0;
  }

  .stepTitle {
    grid-area: title;
  }

  .stepText {
    grid-area: text;
    max-width: none;
  }

  .trustCard {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--spacing-6);
  }

  .noteGrid {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--spacing-12);
  }
}

@media (max-width: 560px) {
  .container,
  .heroInner {
    padding-inline: var(--spacing-4);
  }

  .trustList {
    grid-template-columns: minmax(0, 1fr);
  }

  .ctas > * {
    flex: 1 1 100%;
  }
}
```

---

## 15. `pages/product.tsx` (Sản phẩm)

```tsx
import React from "react";
import { SiteShell } from "../components/SiteShell";
import { PageHead } from "../components/PageHead";
import { Section } from "../components/Section";
import { StepList } from "../components/StepList";
import { TryCta } from "../components/TryCta";
import { AppWindow } from "../components/AppWindow";

const ProductPage = () => (
  <SiteShell>
    <title>Sản phẩm — PARA</title>
    <meta
      name="description"
      content="PARA giúp thầy cô giao bài, nghe bài học viên gửi và hướng dẫn chỗ cần sửa giữa hai buổi học."
    />

    <PageHead
      eyebrow="PARA làm gì"
      title="Thầy cô nghe lại được mỗi lần tập ở nhà."
      lead="Phần lớn thời gian là tự tập ở nhà. PARA giúp thầy cô giao bài, nghe bài học viên gửi và hướng dẫn chỗ cần sửa giữa hai buổi học."
      visual={<AppWindow />}
    />

    <Section eyebrow="Khá hơn theo thời gian" title="Luyện tập, góp ý, luyện lại.">
      <StepList
        items={[
          {
            title: "Luyện tập",
            text: "Bài thầy cô giao và bản thu của học viên nằm cùng một chỗ.",
          },
          {
            title: "Góp ý",
            text: "Thầy cô nghe bài và chỉ đúng chỗ học viên cần sửa lần sau.",
          },
          {
            title: "Khá hơn theo thời gian",
            text: "Xem lại bài đã giao, lần đã tập, và góp ý trước đó.",
          },
        ]}
      />
    </Section>

    <Section
      title="PARA giữ lời thầy giữa hai buổi học, không thay thầy."
      sub="PARA giữ bài, bản thu và góp ý cùng một chỗ. Thầy cô vẫn là người giao bài, nghe bài và chỉ chỗ cần sửa."
    />

    <TryCta />
  </SiteShell>
);

export default ProductPage;
```

---

## 16. `pages/how-it-works.tsx` (Cách hoạt động)

```tsx
import React from "react";
import { ArrowRight } from "lucide-react";
import { SiteShell } from "../components/SiteShell";
import { PageHead } from "../components/PageHead";
import { Section } from "../components/Section";
import { StepList } from "../components/StepList";
import { TryCta } from "../components/TryCta";
import styles from "./how-it-works.module.css";

const HowItWorksPage = () => (
  <SiteShell>
    <title>Cách hoạt động — PARA</title>
    <meta
      name="description"
      content="PARA được làm để việc giao bài, gửi bài và góp ý giữa hai buổi học thật đơn giản."
    />

    <PageHead
      eyebrow="Cách hoạt động"
      title="Giao bài, gửi bài, góp ý. Đơn giản."
      lead="PARA được làm để việc giao bài, gửi bài và góp ý giữa hai buổi học thật đơn giản."
    />

    <Section eyebrow="Từ bài giao đến lần tập sau" title="Mỗi lần tập, thầy cô đều nghe và góp ý.">
      <StepList
        items={[
          { title: "Giao bài", text: "Thầy cô giao một bài tập rõ." },
          { title: "Luyện tập", text: "Học viên tập bài đó ở nhà, giữa hai buổi học." },
          {
            title: "Gửi bài",
            text: "Học viên mở link, chọn bản thu âm hoặc video đã có, rồi gửi.",
          },
          { title: "Góp ý", text: "Thầy cô nghe và chỉ chỗ cần sửa." },
          {
            title: "Luyện lại",
            text: "Học viên tập lại. Phụ huynh được cho xem thì thấy con đã tập gì và thầy cô đã góp ý gì.",
          },
        ]}
      />
    </Section>

    <Section
      title="Học viên không cần học một phần mềm mới chỉ để gửi bài."
      sub="Link để gửi bài cho nhanh. Bài, bản thu và góp ý nằm cùng một chỗ thì mới dùng lâu."
    >
      <div className={styles.chips}>
        <span className={styles.chip}>Mở link</span>
        <ArrowRight size={18} className={styles.arrow} aria-hidden="true" />
        <span className={styles.chip}>Chọn bản thu</span>
        <ArrowRight size={18} className={styles.arrow} aria-hidden="true" />
        <span className={`${styles.chip} ${styles.chipMain}`}>Gửi bài</span>
      </div>
    </Section>

    <TryCta />
  </SiteShell>
);

export default HowItWorksPage;
```

`how-it-works.module.css`
```css
.chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-3);
}

.chip {
  padding: var(--spacing-3) 1.25rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  background: var(--card);
  font-size: 0.95rem;
  font-weight: 500;
}

.chipMain {
  border-color: var(--primary);
  background: var(--primary);
  color: var(--primary-foreground);
  font-weight: 600;
}

.arrow {
  color: var(--accent);
}
```

---

## 17. `pages/faq.tsx` (Hỏi đáp)

```tsx
import React from "react";
import { SiteShell } from "../components/SiteShell";
import { PageHead } from "../components/PageHead";
import { Section } from "../components/Section";
import { TryCta } from "../components/TryCta";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "../components/Accordion";
import { faqItems } from "../helpers/faqItems";
import styles from "./faq.module.css";

const FaqPage = () => (
  <SiteShell>
    <title>Câu hỏi thường gặp — PARA</title>
    <meta
      name="description"
      content="PARA vẫn đang được thử và hoàn thiện. Một số phần có thể thay đổi."
    />

    <PageHead
      eyebrow="Câu hỏi thường gặp"
      title="Một vài điều cần biết về PARA."
      lead="PARA vẫn đang được thử và hoàn thiện. Một số phần có thể thay đổi."
    />

    <Section>
      <div className={styles.faq}>
        <Accordion type="single" collapsible variant="plain">
          {faqItems.map((f, i) => (
            <AccordionItem key={f.q} value={`item-${i}`}>
              <AccordionTrigger>{f.q}</AccordionTrigger>
              <AccordionContent>{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>

    <TryCta />
  </SiteShell>
);

export default FaqPage;
```

`faq.module.css`
```css
.faq {
  max-width: 48rem;
  margin-inline: auto;
}
```

---

## Open items (not yet decided)

- The class-code input uses a monospace font and looks off against the Apple type. Candidate fix: use `--font-family-base`, keep letter-spacing 0.04em.
- Accent colour: copper `#8b5e34` kept for brand. Alternative is Apple blue `#0071e3`. Not chosen.
- Mobile layout (390px) and tablet were not visually verified in the Floot preview. Check them in the real build.
- Founder / people page removed. Live site lists "Henry Nguyen" and "Aaron Ta"; the project notes list Aaron, Phong and Tuan. Resolve before any people page returns.
