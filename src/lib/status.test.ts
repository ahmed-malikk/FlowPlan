import { describe, expect, it } from "vitest";
import { exampleProject } from "./plan";
import { schedule, type Task } from "./scheduler";
import { statusLine } from "./status";

const START = "2026-10-14";

describe("statusLine", () => {
  it("asks for a first task when the plan is empty", () => {
    const result = schedule({ tasks: [] });
    const s = statusLine(START, [], result);
    expect(s.finishDate).toBeNull();
    expect(s.text).toMatch(/No tasks yet/);
  });

  it("reports the finish date, critical count and progress for the example plan", () => {
    const project = exampleProject(START);
    const s = statusLine(START, project.tasks, schedule(project));
    expect(s.finishDate).toBe("Sun 25 Oct");
    expect(s.text).toBe("Finishes on day 12. 5 of 7 tasks are critical, 0 done.");
  });

  it("counts finished tasks", () => {
    const project = exampleProject(START);
    const tasks = project.tasks.map((t, i) => (i < 2 ? { ...t, done: true } : t));
    expect(statusLine(START, tasks, schedule({ tasks })).text).toMatch(/2 done\.$/);
  });

  it("says everything is done when every task is ticked", () => {
    const project = exampleProject(START);
    const tasks = project.tasks.map((t) => ({ ...t, done: true }));
    expect(statusLine(START, tasks, schedule({ tasks })).text).toBe("All 7 tasks are done.");
    const one: Task[] = [{ id: "a", name: "A", duration: 1, dependsOn: [], done: true }];
    expect(statusLine(START, one, schedule({ tasks: one })).text).toBe("All 1 task is done.");
  });

  it("says so when the plan has a loop", () => {
    const tasks: Task[] = [
      { id: "a", name: "A", duration: 1, dependsOn: ["b"] },
      { id: "b", name: "B", duration: 1, dependsOn: ["a"] },
    ];
    const s = statusLine(START, tasks, schedule({ tasks }));
    expect(s.finishDate).toBeNull();
    expect(s.text).toMatch(/loop/);
  });
});
