/**
 * The "how the critical path is found" explainer: for each of the four steps, what every task
 * card says. The numbers come from the real scheduler, so the page can never disagree with the app.
 */
import type { ScheduledTask } from "./scheduler";

export type ExplainStep = 1 | 2 | 3 | 4;

export type ExplainCard = {
  id: string;
  name: string;
  lines: [string, string];
  critical: boolean; // highlighted in the last step, for tasks with zero slack
};

export const STEP_TITLES: Record<ExplainStep, string> = {
  1: "Order",
  2: "Forward pass",
  3: "Backward pass",
  4: "Slack",
};

export const STEP_TEXT: Record<ExplainStep, string> = {
  1: "Put the tasks in an order where every task comes after the ones it waits for. If that is impossible there is a loop, and the plan is refused.",
  2: "Forward pass: a task starts when its last prerequisite finishes. Start = the latest finish among what it waits for. Finish = start + days.",
  3: "Backward pass, from the end: a task must finish before the first task that waits for it has to start. Latest finish, then latest start = latest finish − days.",
  4: "Slack = latest start − earliest start. Zero slack means the task is critical: if it slips, the whole plan slips.",
};

/** `tasks` in topological order, as schedule() returns them. The backward pass lists them last to first. */
export function explainCards(step: ExplainStep, tasks: ScheduledTask[]): ExplainCard[] {
  const names = new Map(tasks.map((t) => [t.id, t.name]));
  const ordered = step === 3 ? [...tasks].reverse() : tasks;

  return ordered.map((t): ExplainCard => {
    let lines: [string, string];
    if (step === 1) {
      const waits = t.dependsOn.map((d) => names.get(d)).filter(Boolean);
      lines = [`waits for: ${waits.length ? waits.join(", ") : "nothing"}`, `order ${tasks.indexOf(t) + 1}`];
    } else if (step === 2) {
      lines = [`start day ${t.es}`, `finish day ${t.ef}`];
    } else if (step === 3) {
      lines = [`latest finish ${t.lf}`, `latest start ${t.ls}`];
    } else {
      lines = [`slack ${t.slack} ${t.slack === 1 ? "day" : "days"}`, t.critical ? "critical" : "can slip"];
    }
    return { id: t.id, name: t.name, lines, critical: step === 4 && t.critical };
  });
}
