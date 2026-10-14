import { describe, expect, it } from "vitest";
import { routeProgress, stationReached } from "./scrollRoute";

describe("routeProgress", () => {
  it("is empty while the block is still below the drawing line", () => {
    expect(routeProgress(900, 2000, 800)).toBe(0);
  });

  it("is full once the whole block has passed the drawing line", () => {
    expect(routeProgress(-3000, 2000, 800)).toBe(1);
  });

  it("is proportional in between", () => {
    // line at 520 px; block starts at 20 px and is 1000 px tall: 500 of 1000 px reached
    expect(routeProgress(20, 1000, 800)).toBeCloseTo(0.5, 5);
  });

  it("does not divide by zero", () => {
    expect(routeProgress(0, 0, 800)).toBe(0);
  });
});

describe("stationReached", () => {
  it("lights a station once its section is above 65 % of the window", () => {
    expect(stationReached(500, 800)).toBe(true);
    expect(stationReached(520, 800)).toBe(false);
    expect(stationReached(700, 800)).toBe(false);
  });
});
