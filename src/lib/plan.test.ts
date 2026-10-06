import { describe, expect, it } from "vitest";
import {
  addDays,
  dependentsOf,
  endDateOf,
  exampleProject,
  removeTask,
  setDuration,
  startDateOf,
  validateTask,
  type TaskInput,
} from "./plan";
import { schedule, type Task } from "./scheduler";
import { parseProjects } from "./storage";

function t(id: string, duration: number, ...dependsOn: string[]): Task {
  return { id, name: id, duration, dependsOn };
}

function input(over: Partial<TaskInput> = {}): TaskInput {
  return { name: "Design", duration: "2", owner: "", dependsOn: [], ...over };
}

describe("validateTask (story 1: add tasks with a duration)", () => {
  it("accepts a name and a whole number of days ≥ 1", () => {
    const r = validateTask(input(), []);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.task).toMatchObject({ name: "Design", duration: 2, dependsOn: [] });
  });

  it("trims the name and keeps an owner only when given", () => {
    const r = validateTask(input({ name: "  Design  ", owner: " Sara " }), []);
    expect(r.ok && r.task).toMatchObject({ name: "Design", owner: "Sara" });
    const r2 = validateTask(input({ owner: "  " }), []);
    expect(r2.ok && "owner" in r2.task).toBe(false);
  });

  it("rejects an empty name", () => {
    const r = validateTask(input({ name: "   " }), []);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.name).toBeDefined();
  });

  it.each(["0", "-2", "1.5", "abc", "", "1e2"])("rejects duration %j", (duration) => {
    const r = validateTask(input({ duration }), []);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.duration).toBeDefined();
  });

  it("keeps the id when editing", () => {
    const r = validateTask(input({ name: "A2" }), [t("A", 1)], "A");
    expect(r.ok && r.task.id).toBe("A");
  });
});

describe("validateTask (stories 2 and 3: dependencies and loops)", () => {
  const tasks = [t("A", 1), t("B", 1, "A"), t("C", 1, "B")];

  it("saves one or more existing dependencies", () => {
    const r = validateTask(input({ dependsOn: ["A", "B"] }), tasks);
    expect(r.ok && r.task.dependsOn).toEqual(["A", "B"]);
  });

  it("blocks a task depending on itself", () => {
    const r = validateTask(input({ dependsOn: ["A"] }), tasks, "A");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.dependsOn).toMatch(/itself/);
  });

  it("blocks a save that creates a loop and names the tasks in it", () => {
    // Making A wait for C closes A → B → C → A.
    const r = validateTask(input({ name: "A", dependsOn: ["C"] }), tasks, "A");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.dependsOn).toMatch(/loop/);
      for (const name of ["A", "B", "C"]) expect(r.errors.dependsOn).toContain(name);
    }
  });

  it("drops dependencies on tasks that no longer exist", () => {
    const r = validateTask(input({ dependsOn: ["A", "ghost"] }), tasks);
    expect(r.ok && r.task.dependsOn).toEqual(["A"]);
  });
});

describe("removeTask", () => {
  it("deletes the task and removes it from tasks that depended on it", () => {
    const tasks = [t("A", 1), t("B", 1, "A"), t("C", 1, "A", "B")];
    expect(dependentsOf(tasks, "A").map((x) => x.id)).toEqual(["B", "C"]);
    const after = removeTask(tasks, "A");
    expect(after).toEqual([t("B", 1), t("C", 1, "B")]);
  });
});

describe("setDuration (instant what-if)", () => {
  it("changes one duration and the schedule follows", () => {
    const tasks = [t("A", 2), t("B", 3, "A")];
    const after = setDuration(tasks, "A", 5);
    const r = schedule({ tasks: after });
    expect(r.ok && r.finish).toBe(8);
  });

  it("never goes below 1 day", () => {
    expect(setDuration([t("A", 2)], "A", 0)[0].duration).toBe(1);
  });
});

describe("dates", () => {
  it("day numbers become calendar dates only for display", () => {
    expect(addDays("2026-10-06", 0)).toBe("2026-10-06");
    expect(addDays("2026-10-30", 3)).toBe("2026-11-02");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });

  it("a 1-day task on day 0 starts and ends on the start date", () => {
    expect(startDateOf("2026-10-06", 0)).toBe("2026-10-06");
    expect(endDateOf("2026-10-06", 1)).toBe("2026-10-06");
  });

  it("the worked example (12 days from 6 Oct) ends on 17 Oct", () => {
    expect(endDateOf("2026-10-06", 12)).toBe("2026-10-17");
  });
});

describe("example project", () => {
  it("is the guide's worked example: 12 days, 5 critical tasks", () => {
    const r = schedule(exampleProject("2026-10-06"));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.finish).toBe(12);
    expect(r.tasks.filter((x) => x.critical).map((x) => x.name)).toEqual([
      "Requirements",
      "UI design",
      "Backend API",
      "Testing",
      "Deploy",
    ]);
  });
});

describe("parseProjects (story 5: plans survive a reload)", () => {
  it("round-trips saved projects", () => {
    const p = exampleProject("2026-10-06");
    expect(parseProjects(JSON.stringify([p]))).toEqual([p]);
  });

  it("returns no projects for empty or corrupt storage", () => {
    expect(parseProjects(null)).toEqual([]);
    expect(parseProjects("not json")).toEqual([]);
    expect(parseProjects('{"a":1}')).toEqual([]);
  });

  it("drops malformed tasks instead of crashing", () => {
    const raw = JSON.stringify([
      {
        id: "p",
        name: "P",
        startDate: "2026-10-06",
        tasks: [{ id: "a", name: "A", duration: 2, dependsOn: [] }, { id: "b", name: "B", duration: 0 }, null],
      },
    ]);
    expect(parseProjects(raw)[0].tasks.map((x) => x.id)).toEqual(["a"]);
  });
});
