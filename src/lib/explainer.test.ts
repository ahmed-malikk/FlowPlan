import { describe, expect, it } from "vitest";
import { explainCards, STEP_TEXT, STEP_TITLES } from "./explainer";
import { exampleProject } from "./plan";
import { schedule, type ScheduledTask } from "./scheduler";

const result = schedule(exampleProject("2026-10-14"));
if (!result.ok) throw new Error("example project should schedule");
const tasks: ScheduledTask[] = result.tasks;
const card = (cards: ReturnType<typeof explainCards>, name: string) => cards.find((c) => c.name === name)!;

describe("explainCards", () => {
  it("step 1 lists every task in schedule order with what it waits for", () => {
    const cards = explainCards(1, tasks);
    expect(cards.map((c) => c.name)).toEqual(tasks.map((t) => t.name));
    expect(card(cards, "Requirements").lines).toEqual(["waits for: nothing", "order 1"]);
    expect(card(cards, "Testing").lines[0]).toBe("waits for: Backend API, Frontend");
  });

  it("step 2 shows the real earliest start and finish", () => {
    const cards = explainCards(2, tasks);
    expect(card(cards, "Requirements").lines).toEqual(["start day 0", "finish day 2"]);
    expect(card(cards, "Deploy").lines).toEqual(["start day 11", "finish day 12"]);
  });

  it("step 3 lists the tasks last to first and shows the latest finish and start", () => {
    const cards = explainCards(3, tasks);
    expect(cards[0].name).toBe(tasks[tasks.length - 1].name);
    expect(card(cards, "Deploy").lines).toEqual(["latest finish 12", "latest start 11"]);
    expect(card(cards, "User docs").lines).toEqual(["latest finish 11", "latest start 10"]);
  });

  it("step 4 shows slack and marks exactly the critical tasks", () => {
    const cards = explainCards(4, tasks);
    expect(card(cards, "Requirements").lines).toEqual(["slack 0 days", "critical"]);
    expect(card(cards, "Frontend").lines).toEqual(["slack 1 day", "can slip"]);
    expect(card(cards, "User docs").lines).toEqual(["slack 5 days", "can slip"]);
    expect(cards.filter((c) => c.critical).map((c) => c.name).sort()).toEqual(
      tasks.filter((t) => t.critical).map((t) => t.name).sort(),
    );
  });

  it("only highlights critical tasks in the last step", () => {
    expect(explainCards(2, tasks).some((c) => c.critical)).toBe(false);
  });

  it("has a title and an explanation for each step", () => {
    for (const s of [1, 2, 3, 4] as const) {
      expect(STEP_TITLES[s]).toBeTruthy();
      expect(STEP_TEXT[s].length).toBeGreaterThan(40);
    }
  });
});
