import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The design tokens live in src/app/globals.css. These tests read them from there and check the
 * colour pairs the interface relies on against WCAG 2.2 AA (4.5:1 for text, 3:1 for controls).
 */
const css = readFileSync(join(__dirname, "../app/globals.css"), "utf8");
const root = css.slice(css.indexOf(":root {"), css.indexOf("}", css.indexOf(":root {")));

function token(name: string): string {
  const match = root.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!match) throw new Error(`token --${name} is not a 6-digit hex colour in globals.css`);
  return match[1];
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("design tokens meet WCAG 2.2 AA", () => {
  const text: Array<[string, string]> = [
    ["foreground", "g0"],
    ["foreground", "g2"],
    ["foreground", "card"],
    ["muted-foreground", "g2"],
    ["muted-foreground", "card"],
    ["primary-foreground", "primary"],
    ["amber-text", "card"],
    ["amber-text", "surface-2"],
    ["destructive", "card"],
  ];
  it.each(text)("text %s on %s is at least 4.5:1", (fg, bg) => {
    expect(contrast(token(fg), token(bg))).toBeGreaterThanOrEqual(4.5);
  });

  const nonText: Array<[string, string]> = [
    ["input", "card"],
    ["input", "g2"],
    ["ring", "g2"],
    ["primary", "g2"],
    ["slack", "card"],
    ["done", "card"],
  ];
  it.each(nonText)("control or marker %s on %s is at least 3:1", (fg, bg) => {
    expect(contrast(token(fg), token(bg))).toBeGreaterThanOrEqual(3);
  });

  it("the page gradient runs from the darkest navy at the top to a deeper navy lower down", () => {
    expect(luminance(token("g0"))).toBeLessThan(luminance(token("g1")));
    expect(luminance(token("g1"))).toBeLessThan(luminance(token("g2")));
  });
});
