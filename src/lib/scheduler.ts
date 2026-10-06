/**
 * FlowPlan scheduler: the Critical Path Method (CPM).
 *
 * 1. Build the graph   – each task is a node, "B depends on A" is an arrow A → B.
 * 2. Topological sort  – Kahn's algorithm puts tasks in a valid order, or finds a loop.
 * 3. Forward pass      – earliest start/finish of every task.
 * 4. Backward pass     – latest start/finish that doesn't delay the project.
 *
 * slack = latest start − earliest start. Tasks with zero slack are the critical path.
 * Every step visits each task and dependency once, so the whole thing is O(V + E).
 *
 * No React in here on purpose: pure functions are easy to test and explain.
 */

export type Task = {
  id: string;
  name: string;
  duration: number; // whole working days, ≥ 1
  dependsOn: string[]; // ids of tasks that must finish first
  owner?: string;
};

export type Project = {
  id: string;
  name: string;
  startDate: string; // "YYYY-MM-DD" = day 0
  tasks: Task[];
};

export type ScheduledTask = Task & {
  es: number; // earliest start
  ef: number; // earliest finish
  ls: number; // latest start
  lf: number; // latest finish
  slack: number;
  critical: boolean;
};

export type SortResult =
  | { ok: true; order: string[] }
  | { ok: false; stuck: string[]; cycle: string[] };

export type ScheduleResult =
  | {
      ok: true;
      tasks: ScheduledTask[]; // in topological order
      finish: number; // project length in days
      warnings: string[];
    }
  | {
      ok: false;
      cycle: string[]; // ids in loop order, first id repeated at the end
      warnings: string[];
    };

type Graph = {
  byId: Map<string, Task>;
  successors: Map<string, string[]>; // A → tasks that wait for A
  predecessors: Map<string, string[]>; // B → tasks B waits for
};

/** Step 1: turn the task list into a graph. Unknown dependency ids are skipped. */
export function buildGraph(tasks: Task[]): Graph {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const successors = new Map<string, string[]>();
  const predecessors = new Map<string, string[]>();
  for (const t of tasks) {
    successors.set(t.id, []);
    predecessors.set(t.id, []);
  }
  for (const t of tasks) {
    for (const dep of new Set(t.dependsOn)) {
      if (!byId.has(dep)) continue;
      successors.get(dep)!.push(t.id);
      predecessors.get(t.id)!.push(dep);
    }
  }
  return { byId, successors, predecessors };
}

/**
 * Step 2: Kahn's algorithm.
 * Repeatedly take a task with no unfinished prerequisites ("in-degree 0").
 * If some tasks never reach in-degree 0, they are in (or behind) a loop.
 */
export function topologicalSort(tasks: Task[]): SortResult {
  const { successors, predecessors } = buildGraph(tasks);

  const inDegree = new Map<string, number>();
  for (const t of tasks) inDegree.set(t.id, predecessors.get(t.id)!.length);

  // Seed with tasks that wait for nothing, in the order the user entered them.
  const queue = tasks.filter((t) => inDegree.get(t.id) === 0).map((t) => t.id);
  const order: string[] = [];

  for (let i = 0; i < queue.length; i++) {
    const id = queue[i];
    order.push(id);
    for (const next of successors.get(id)!) {
      const remaining = inDegree.get(next)! - 1;
      inDegree.set(next, remaining);
      if (remaining === 0) queue.push(next);
    }
  }

  if (order.length === tasks.length) return { ok: true, order };

  const done = new Set(order);
  const stuck = tasks.filter((t) => !done.has(t.id)).map((t) => t.id);
  return { ok: false, stuck, cycle: findCycle(stuck, predecessors) };
}

/**
 * Every stuck task waits for at least one other stuck task, so walking
 * backwards through stuck predecessors must eventually revisit a task.
 * The part of the walk between the two visits is the loop.
 */
function findCycle(stuck: string[], predecessors: Map<string, string[]>): string[] {
  const isStuck = new Set(stuck);
  const seenAt = new Map<string, number>();
  const walk: string[] = [];
  let current = stuck[0];

  while (!seenAt.has(current)) {
    seenAt.set(current, walk.length);
    walk.push(current);
    current = predecessors.get(current)!.find((p) => isStuck.has(p))!;
  }

  // walk goes "waits for" direction (C → B → A); flip it to "comes before" (A → B → C).
  const loop = walk.slice(seenAt.get(current)!).reverse();
  return [...loop, loop[0]];
}

/** Step 3: earliest start = the latest earliest-finish among its dependencies. */
export function forwardPass(
  tasks: Task[],
  order: string[],
): Map<string, { es: number; ef: number }> {
  const { byId, predecessors } = buildGraph(tasks);
  const result = new Map<string, { es: number; ef: number }>();

  for (const id of order) {
    const es = Math.max(0, ...predecessors.get(id)!.map((p) => result.get(p)!.ef));
    result.set(id, { es, ef: es + byId.get(id)!.duration });
  }
  return result;
}

/** Step 4: latest finish = the earliest latest-start among tasks that wait for it. */
export function backwardPass(
  tasks: Task[],
  order: string[],
  end: number,
): Map<string, { ls: number; lf: number }> {
  const { byId, successors } = buildGraph(tasks);
  const result = new Map<string, { ls: number; lf: number }>();

  for (const id of [...order].reverse()) {
    const lf = Math.min(end, ...successors.get(id)!.map((s) => result.get(s)!.ls));
    result.set(id, { ls: lf - byId.get(id)!.duration, lf });
  }
  return result;
}

/** The one function the UI calls. */
export function schedule(project: Pick<Project, "tasks">): ScheduleResult {
  const { tasks } = project;
  const warnings: string[] = [];

  const ids = new Set(tasks.map((t) => t.id));
  for (const t of tasks) {
    for (const dep of t.dependsOn) {
      if (!ids.has(dep)) warnings.push(`"${t.name}" depends on a task that no longer exists.`);
    }
  }

  const sorted = topologicalSort(tasks);
  if (!sorted.ok) {
    warnings.push(`Circular dependency: ${describeCycle(sorted.cycle, tasks)}`);
    return { ok: false, cycle: sorted.cycle, warnings };
  }

  const early = forwardPass(tasks, sorted.order);
  const finish = Math.max(0, ...[...early.values()].map((e) => e.ef));
  const late = backwardPass(tasks, sorted.order, finish);

  const byId = new Map(tasks.map((t) => [t.id, t]));
  const scheduled = sorted.order.map((id): ScheduledTask => {
    const { es, ef } = early.get(id)!;
    const { ls, lf } = late.get(id)!;
    const slack = ls - es;
    return { ...byId.get(id)!, es, ef, ls, lf, slack, critical: slack === 0 };
  });

  return { ok: true, tasks: scheduled, finish, warnings };
}

/** Names of the tasks in a loop, e.g. "A → B → C → A". Used for error messages. */
export function describeCycle(cycle: string[], tasks: Task[]): string {
  const names = new Map(tasks.map((t) => [t.id, t.name]));
  return cycle.map((id) => names.get(id) ?? id).join(" → ");
}
