import { describe, expect, it } from "vitest";
import { scrollProgress } from "./scrollProgress";

describe("scrollProgress", () => {
  it("is null when the page does not scroll", () => {
    expect(scrollProgress(0, 800, 800)).toBeNull();
    expect(scrollProgress(0, 500, 800)).toBeNull();
  });

  it("runs from 0 at the top to 1 at the bottom", () => {
    expect(scrollProgress(0, 1600, 800)).toBe(0);
    expect(scrollProgress(400, 1600, 800)).toBe(0.5);
    expect(scrollProgress(800, 1600, 800)).toBe(1);
  });

  it("stays between 0 and 1 when the page is over-scrolled", () => {
    expect(scrollProgress(-60, 1600, 800)).toBe(0);
    expect(scrollProgress(5000, 1600, 800)).toBe(1);
  });
});
