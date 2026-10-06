import { describe, expect, it } from "vitest";
import { schedule, topologicalSort, type ScheduledTask, type Task } from "./scheduler";

/** Shorthand: t("C", 4, "B") = task C, 4 days, depends on B. */
function t(id: string, duration: number, ...dependsOn: string[]): Task {
  return { id, name: id, duration, dependsOn };
}

function run(tasks: Task[]) {
  const result = schedule({ tasks });
  if (!result.ok) throw new Error(`unexpected cycle: ${result.warnings.join("; ")}`);
  const byId = Object.fromEntries(result.tasks.map((s) => [s.id, s])) as Record<string, ScheduledTask>;
  const critical = result.tasks.filter((s) => s.critical).map((s) => s.id).sort();
  return { ...result, byId, critical };
}

describe("worked example from the product guide (website, 7 tasks)", () => {
  const tasks = [
    t("A", 2),
    t("B", 3, "A"),
    t("C", 4, "B"),
    t("D", 3, "B"),
    t("F", 1, "B"),
    t("E", 2, "C", "D"),
    t("G", 1, "E", "F"),
  ];
  const r = run(tasks);

  it("finishes on day 12", () => {
    expect(r.finish).toBe(12);
  });

  it("critical path is A, B, C, E, G", () => {
    expect(r.critical).toEqual(["A", "B", "C", "E", "G"]);
  });

  it("D has 1 day of slack and F has 5", () => {
    expect(r.byId.D.slack).toBe(1);
    expect(r.byId.F.slack).toBe(5);
  });

  it("matches every number in the guide's table", () => {
    const table = {
      A: [0, 2, 0, 2, 0],
      B: [2, 5, 2, 5, 0],
      C: [5, 9, 5, 9, 0],
      D: [5, 8, 6, 9, 1],
      F: [5, 6, 10, 11, 5],
      E: [9, 11, 9, 11, 0],
      G: [11, 12, 11, 12, 0],
    };
    for (const [id, [es, ef, ls, lf, slack]] of Object.entries(table)) {
      const s = r.byId[id];
      expect([s.es, s.ef, s.ls, s.lf, s.slack], id).toEqual([es, ef, ls, lf, slack]);
    }
  });

  it("if Backend (C) slips 2 days, the project moves from day 12 to day 14", () => {
    const slipped = tasks.map((x) => (x.id === "C" ? { ...x, duration: 6 } : x));
    expect(run(slipped).finish).toBe(14);
  });

  it("if Frontend (D) slips 1 day (its slack), the finish does not move", () => {
    const slipped = tasks.map((x) => (x.id === "D" ? { ...x, duration: 4 } : x));
    expect(run(slipped).finish).toBe(12);
  });
});

describe("more hand-calculated projects", () => {
  it("house build: Roof has 1 day slack, Electrical is critical", () => {
    // Foundation 5 → Walls 10 → Roof 3 ┐
    //                     └→ Electrical 4 → Paint 2
    const r = run([
      t("Foundation", 5),
      t("Walls", 10, "Foundation"),
      t("Roof", 3, "Walls"),
      t("Electrical", 4, "Walls"),
      t("Paint", 2, "Roof", "Electrical"),
    ]);
    expect(r.finish).toBe(21);
    expect(r.critical).toEqual(["Electrical", "Foundation", "Paint", "Walls"]);
    expect(r.byId.Roof).toMatchObject({ es: 15, ef: 18, ls: 16, lf: 19, slack: 1 });
    expect(r.byId.Paint).toMatchObject({ es: 19, ef: 21 });
  });

  it("task waiting for two starts: it starts when the longer one finishes", () => {
    const r = run([t("A", 2), t("B", 4), t("C", 1, "A", "B")]);
    expect(r.finish).toBe(5);
    expect(r.byId.C.es).toBe(4);
    expect(r.byId.A.slack).toBe(2);
    expect(r.critical).toEqual(["B", "C"]);
  });

  it("FYP sprint: research and setup run in parallel", () => {
    const r = run([
      t("Proposal", 3),
      t("Research", 5, "Proposal"),
      t("Setup", 2, "Proposal"),
      t("Build", 8, "Research", "Setup"),
      t("Report", 4, "Research"),
      t("Viva", 1, "Build", "Report"),
    ]);
    expect(r.finish).toBe(17);
    expect(r.critical).toEqual(["Build", "Proposal", "Research", "Viva"]);
    expect(r.byId.Setup.slack).toBe(3);
    expect(r.byId.Report.slack).toBe(4);
  });
});

describe("edge cases", () => {
  it("no tasks: finish 0, no crash", () => {
    const r = run([]);
    expect(r.finish).toBe(0);
    expect(r.tasks).toEqual([]);
  });

  it("one task with no dependencies is critical and sets the length", () => {
    const r = run([t("Solo", 4)]);
    expect(r.finish).toBe(4);
    expect(r.byId.Solo.critical).toBe(true);
  });

  it("two independent chains: longer is critical, shorter gets the difference as slack", () => {
    const r = run([t("A", 3), t("B", 2, "A"), t("C", 1), t("D", 1, "C")]);
    expect(r.finish).toBe(5);
    expect(r.critical).toEqual(["A", "B"]);
    expect(r.byId.C.slack).toBe(3);
    expect(r.byId.D.slack).toBe(3);
  });

  it("two critical paths of equal length are both critical", () => {
    const r = run([t("A", 1), t("B", 2, "A"), t("C", 2, "A"), t("D", 1, "B", "C")]);
    expect(r.finish).toBe(4);
    expect(r.critical).toEqual(["A", "B", "C", "D"]);
  });

  it("loop A → B → C → A is reported with the tasks in order", () => {
    const r = schedule({ tasks: [t("A", 1, "C"), t("B", 1, "A"), t("C", 1, "B")] });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.cycle.slice(0, -1).sort()).toEqual(["A", "B", "C"]);
    expect(r.cycle[0]).toBe(r.cycle[r.cycle.length - 1]);
    expect(r.warnings[0]).toMatch(/^Circular dependency: /);
  });

  it("loop report leaves out tasks that only sit behind the loop", () => {
    // X waits for the loop but isn't part of it.
    const r = schedule({ tasks: [t("A", 1, "B"), t("B", 1, "A"), t("X", 1, "A")] });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.cycle.slice(0, -1).sort()).toEqual(["A", "B"]);
  });

  it("a task depending on itself is a loop", () => {
    const r = schedule({ tasks: [t("A", 1, "A")] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.cycle).toEqual(["A", "A"]);
  });

  it("a dependency on a deleted task is ignored with a warning", () => {
    const r = schedule({ tasks: [t("A", 2, "ghost")] });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.finish).toBe(2);
      expect(r.warnings).toHaveLength(1);
    }
  });

  it("duplicate dependency ids are counted once", () => {
    const r = run([t("A", 2), t("B", 1, "A", "A")]);
    expect(r.finish).toBe(3);
  });
});

describe("topologicalSort", () => {
  it("puts every task after the tasks it waits for", () => {
    const tasks = [t("C", 1, "B"), t("B", 1, "A"), t("A", 1)];
    const r = topologicalSort(tasks);
    expect(r).toEqual({ ok: true, order: ["A", "B", "C"] });
  });

  it("keeps the user's order for unrelated tasks", () => {
    const r = topologicalSort([t("X", 1), t("Y", 1), t("Z", 1)]);
    expect(r).toEqual({ ok: true, order: ["X", "Y", "Z"] });
  });
});
