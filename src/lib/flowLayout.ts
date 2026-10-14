/**
 * The shape of a plan as a flow: which level each task sits on and which edges join them.
 * Pure functions with no React in them. The mini route on a project card and the big flow
 * diagram both draw from this, each with its own geometry.
 */
import type { ScheduledTask } from "./scheduler";

export type FlowNode = {
  id: string;
  level: number; // how many tasks in a row come before it (0 = starts the plan)
  row: number; // position inside its level, from the top
  rowsInLevel: number; // how many tasks share the level
  critical: boolean;
};

export type FlowEdge = {
  from: string; // the task that has to finish first
  to: string; // the task that waits for it
  critical: boolean; // part of the path that decides the finish date
};

export type FlowStructure = {
  nodes: FlowNode[];
  edges: FlowEdge[];
  levels: number; // number of columns needed
  maxRows: number; // tallest column
};

/** `tasks` must be in topological order, which is how `schedule()` returns them. */
export function flowStructure(tasks: ScheduledTask[]): FlowStructure {
  const level = new Map<string, number>();
  for (const t of tasks) {
    const before = t.dependsOn.filter((d) => level.has(d)).map((d) => level.get(d)!);
    level.set(t.id, before.length ? Math.max(...before) + 1 : 0);
  }

  const inLevel = new Map<number, string[]>();
  for (const t of tasks) {
    const l = level.get(t.id)!;
    inLevel.set(l, [...(inLevel.get(l) ?? []), t.id]);
  }

  const nodes: FlowNode[] = tasks.map((t) => {
    const l = level.get(t.id)!;
    const ids = inLevel.get(l)!;
    return { id: t.id, level: l, row: ids.indexOf(t.id), rowsInLevel: ids.length, critical: t.critical };
  });

  const byId = new Map(tasks.map((t) => [t.id, t]));
  const edges: FlowEdge[] = tasks.flatMap((t) =>
    t.dependsOn
      .filter((d) => byId.has(d))
      .map((d) => {
        const from = byId.get(d)!;
        // Critical means the delay really travels along this edge: both tasks are critical
        // and the second starts exactly when the first finishes.
        return { from: d, to: t.id, critical: from.critical && t.critical && from.ef === t.es };
      }),
  );

  return {
    nodes,
    edges,
    levels: inLevel.size,
    maxRows: Math.max(0, ...[...inLevel.values()].map((ids) => ids.length)),
  };
}
