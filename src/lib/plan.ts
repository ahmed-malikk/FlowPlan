/**
 * Plan helpers the UI needs around the scheduler: validation, safe edits and dates.
 * Pure functions, no React, so they are tested alongside the scheduler.
 */
import { describeCycle, topologicalSort, type Project, type Task } from "./scheduler";

export type TaskInput = { name: string; duration: string; owner: string; dependsOn: string[] };
export type TaskErrors = { name?: string; duration?: string; dependsOn?: string };

export const MAX_DURATION = 999;

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * Validates a task form and, if it is valid, returns the task to save.
 * A save is blocked when the name is empty, the duration isn't a whole number ≥ 1,
 * or the new dependencies would create a loop (the error names the loop).
 */
export function validateTask(
  input: TaskInput,
  tasks: Task[],
  editingId?: string,
): { ok: true; task: Task } | { ok: false; errors: TaskErrors } {
  const errors: TaskErrors = {};
  const name = input.name.trim();
  const durationText = input.duration.trim();

  if (!name) errors.name = "Give the task a name.";
  if (!/^\d+$/.test(durationText) || Number(durationText) < 1) {
    errors.duration = "Duration must be a whole number of days, 1 or more.";
  } else if (Number(durationText) > MAX_DURATION) {
    errors.duration = `Duration can be at most ${MAX_DURATION} days.`;
  }

  const id = editingId ?? newId();
  const known = new Set(tasks.map((t) => t.id));
  const dependsOn = [...new Set(input.dependsOn)].filter((d) => d !== id && known.has(d));
  if (input.dependsOn.includes(id)) errors.dependsOn = "A task can't depend on itself.";

  const task: Task = { id, name, duration: Number(durationText), dependsOn };
  const owner = input.owner.trim();
  if (owner) task.owner = owner;

  if (!errors.dependsOn) {
    const next = upsertTask(tasks, task);
    const sorted = topologicalSort(next);
    if (!sorted.ok) {
      errors.dependsOn = `This would create a loop: ${describeCycle(sorted.cycle, next)}. Remove one of these dependencies.`;
    }
  }

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, task };
}

/** Replaces the task with the same id, or appends it. */
export function upsertTask(tasks: Task[], task: Task): Task[] {
  return tasks.some((t) => t.id === task.id)
    ? tasks.map((t) => (t.id === task.id ? task : t))
    : [...tasks, task];
}

/** Deletes a task and removes it from every other task's dependencies. */
export function removeTask(tasks: Task[], id: string): Task[] {
  return tasks
    .filter((t) => t.id !== id)
    .map((t) => (t.dependsOn.includes(id) ? { ...t, dependsOn: t.dependsOn.filter((d) => d !== id) } : t));
}

/** Tasks that wait for the given task (used in the delete confirmation). */
export function dependentsOf(tasks: Task[], id: string): Task[] {
  return tasks.filter((t) => t.dependsOn.includes(id));
}

/** Changes only the duration. Durations can't create loops, so this is always safe. */
export function setDuration(tasks: Task[], id: string, duration: number): Task[] {
  const clamped = Math.min(MAX_DURATION, Math.max(1, Math.round(duration)));
  return tasks.map((t) => (t.id === id ? { ...t, duration: clamped } : t));
}

// ---- Dates: days are numbers internally and only become dates for display. ----

/** "2026-10-06" + 3 → "2026-10-09". Uses UTC so time zones and DST never shift a day. */
export function addDays(startDate: string, days: number): string {
  const d = new Date(`${startDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Calendar date a task starts on (its first working day). */
export function startDateOf(startDate: string, es: number): string {
  return addDays(startDate, es);
}

/**
 * Calendar date of the last working day of something that finishes at day `ef`.
 * A 1-day task starting on day 0 starts and ends on the project start date.
 */
export function endDateOf(startDate: string, ef: number): string {
  return addDays(startDate, Math.max(ef - 1, 0));
}

export function formatDate(iso: string, withYear = true): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
    timeZone: "UTC",
  });
}

export function todayIso(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function isIsoDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(`${s}T00:00:00Z`).getTime());
}

/** The worked example from the product guide, used as a demo project. */
export function exampleProject(startDate = todayIso()): Project {
  const ids = { A: newId(), B: newId(), C: newId(), D: newId(), E: newId(), F: newId(), G: newId() };
  const t = (k: keyof typeof ids, name: string, duration: number, deps: (keyof typeof ids)[], owner?: string): Task => ({
    id: ids[k],
    name,
    duration,
    dependsOn: deps.map((d) => ids[d]),
    ...(owner ? { owner } : {}),
  });
  return {
    id: newId(),
    name: "Website launch (example)",
    startDate,
    tasks: [
      t("A", "Requirements", 2, [], "Ahmed"),
      t("B", "UI design", 3, ["A"], "Sara"),
      t("C", "Backend API", 4, ["B"], "Bilal"),
      t("D", "Frontend", 3, ["B"], "Sara"),
      t("F", "User docs", 1, ["B"], "Ahmed"),
      t("E", "Testing", 2, ["C", "D"], "Bilal"),
      t("G", "Deploy", 1, ["E", "F"], "Ahmed"),
    ],
  };
}
