import { describe, expect, it } from "vitest";
import { dayTicks, tickStep } from "./timeline";

describe("tickStep", () => {
  it("marks every day for a short plan", () => {
    expect(tickStep(12)).toBe(1);
    expect(tickStep(14)).toBe(1);
  });

  it("widens the spacing as the plan gets longer, never more than about 14 marks", () => {
    expect(tickStep(30)).toBe(5);
    expect(tickStep(90)).toBe(7);
    expect(tickStep(300)).toBe(30);
    for (const span of [3, 15, 40, 120, 365, 999]) expect(span / tickStep(span)).toBeLessThanOrEqual(14);
  });
});

describe("dayTicks", () => {
  it("runs from day 0 to the finish day", () => {
    const ticks = dayTicks(12);
    expect(ticks[0]).toEqual({ day: 0, label: true });
    expect(ticks[ticks.length - 1].day).toBe(12);
    expect(ticks).toHaveLength(13);
  });

  it("always ends on the finish day, even when it is not a multiple of the step", () => {
    const ticks = dayTicks(32); // step 5: 0, 5, ... 30, then 32
    expect(ticks.map((t) => t.day)).toEqual([0, 5, 10, 15, 20, 25, 30, 32]);
  });

  it("drops the last label when it would crowd the one before it", () => {
    const ticks = dayTicks(32);
    expect(ticks[ticks.length - 1]).toEqual({ day: 32, label: false });
    expect(dayTicks(30).every((t) => t.label)).toBe(true);
  });

  it("handles a one-day plan", () => {
    expect(dayTicks(1).map((t) => t.day)).toEqual([0, 1]);
  });
});
