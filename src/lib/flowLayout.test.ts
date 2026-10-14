import { describe, expect, it } from "vitest";
import { flowStructure } from "./flowLayout";
import { exampleProject } from "./plan";
import { schedule, type ScheduledTask } from "./scheduler";

function scheduled(project = exampleProject("2026-10-14")): ScheduledTask[] {
  const result = schedule(project);
  if (!result.ok) throw new Error("example project should schedule");
  return result.tasks;
}

const byName = (nodes: ReturnType<typeof flowStructure>["nodes"], tasks: ScheduledTask[], name: string) => {
  const id = tasks.find((t) => t.name === name)!.id;
  return nodes.find((n) => n.id === id)!;
};

describe("flowStructure on the example project", () => {
  const tasks = scheduled();
  const flow = flowStructure(tasks);

  it("puts each task one level after the latest task it waits for", () => {
    const level = (name: string) => byName(flow.nodes, tasks, name).level;
    expect(level("Requirements")).toBe(0);
    expect(level("UI design")).toBe(1);
    expect(level("Backend API")).toBe(2);
    expect(level("Frontend")).toBe(2);
    expect(level("User docs")).toBe(2);
    expect(level("Testing")).toBe(3);
    expect(level("Deploy")).toBe(4);
    expect(flow.levels).toBe(5);
  });

  it("numbers the tasks inside a level from the top and counts them", () => {
    const parallel = ["Backend API", "Frontend", "User docs"].map((n) => byName(flow.nodes, tasks, n));
    expect(parallel.map((n) => n.row).sort()).toEqual([0, 1, 2]);
    expect(parallel.every((n) => n.rowsInLevel === 3)).toBe(true);
    expect(flow.maxRows).toBe(3);
  });

  it("has one edge per dependency", () => {
    expect(flow.edges).toHaveLength(8);
  });

  it("marks an edge critical only when both ends are critical and the first finishes as the second starts", () => {
    const id = (name: string) => tasks.find((t) => t.name === name)!.id;
    const critical = (from: string, to: string) =>
      flow.edges.find((e) => e.from === id(from) && e.to === id(to))!.critical;
    expect(critical("Requirements", "UI design")).toBe(true);
    expect(critical("UI design", "Backend API")).toBe(true);
    expect(critical("Backend API", "Testing")).toBe(true);
    expect(critical("Testing", "Deploy")).toBe(true);
    // Frontend has one day of slack, User docs has five: their edges are not critical.
    expect(critical("UI design", "Frontend")).toBe(false);
    expect(critical("Frontend", "Testing")).toBe(false);
    expect(critical("UI design", "User docs")).toBe(false);
  });
});

describe("flowStructure edge cases", () => {
  it("handles no tasks", () => {
    expect(flowStructure([])).toEqual({ nodes: [], edges: [], levels: 0, maxRows: 0 });
  });

  it("handles one task", () => {
    const project = { id: "p", name: "One", startDate: "2026-10-14", tasks: [{ id: "a", name: "A", duration: 2, dependsOn: [] }] };
    const flow = flowStructure(scheduled(project));
    expect(flow.nodes).toEqual([{ id: "a", level: 0, row: 0, rowsInLevel: 1, critical: true }]);
    expect(flow.edges).toEqual([]);
    expect(flow.levels).toBe(1);
  });

  it("keeps separate roots on level 0, one row each", () => {
    const project = {
      id: "p",
      name: "Two roots",
      startDate: "2026-10-14",
      tasks: [
        { id: "a", name: "A", duration: 2, dependsOn: [] },
        { id: "b", name: "B", duration: 1, dependsOn: [] },
      ],
    };
    const flow = flowStructure(scheduled(project));
    expect(flow.nodes.map((n) => [n.level, n.row, n.rowsInLevel])).toEqual([
      [0, 0, 2],
      [0, 1, 2],
    ]);
    expect(flow.maxRows).toBe(2);
  });
});
