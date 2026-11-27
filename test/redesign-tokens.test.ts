import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(path.resolve(__dirname, "../styles/app/redesign-tokens.css"), "utf8");
const siteTokens = readFileSync(path.resolve(__dirname, "../styles/site/para-tokens.css"), "utf8");

function token(name: string) {
  const match = new RegExp(`${name}:\\s*([^;]+);`).exec(css);
  return match?.[1].trim().toLowerCase();
}

describe("redesign tokens", () => {
  it("uses the plan's colour roles", () => {
    expect(token("--rd-canvas")).toBe("#ffffff");
    expect(token("--rd-surface")).toBe("#f5f5f7");
    expect(token("--rd-ink")).toBe("#111111");
    expect(token("--rd-muted")).toBe("#626267");
    expect(token("--rd-line")).toBe("#dedee2");
    expect(token("--rd-field-border")).toBe("#8e8e93");
    expect(token("--rd-focus")).toBe("#38383c");
    expect(token("--rd-button-hover")).toBe("#333333");
    expect(token("--rd-button-pressed")).toBe("#000000");
    expect(token("--rd-error")).toBe("#b42318");
    expect(token("--rd-sand")).toBe("#d6b98c");
    expect(token("--rd-sand-tint")).toBe("#f6efe3");
    expect(token("--rd-sand-text")).toBe("#8b5e34");
  });

  it("uses the same device font as the homepage, with no webfont", () => {
    const homepage = /--font-system:\s*([^;]+);/.exec(siteTokens)?.[1].trim();
    expect(homepage).toBeTruthy();
    expect(/--rd-font:\s*([^;]+);/.exec(css)?.[1].trim()).toBe(homepage);
    expect(css).not.toMatch(/@font-face|@import|url\(/);
  });

  it("is light only and scoped to .para-rd", () => {
    expect(css).not.toMatch(/prefers-color-scheme|data-theme|dark/i);
    expect(css).toMatch(/color-scheme:\s*light/);
    const selectors = css
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .split("}")
      .map((block) => block.split("{")[0].trim())
      .filter(Boolean);
    for (const selector of selectors) expect(selector.startsWith(".para-rd")).toBe(true);
  });
});
