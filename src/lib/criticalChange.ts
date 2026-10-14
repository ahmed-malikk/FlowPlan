/**
 * When a what-if change or an edit moves the critical path, say which tasks joined it and which
 * left it. Pure functions: the wording is tested and the same sentence goes to the screen and to
 * screen readers.
 */
import type { ScheduledTask } from "./scheduler";

export type CriticalChange = {
  became: string[]; // names of tasks that are critical now and were not before
  stopped: string[]; // names of tasks that were critical and no longer are (tasks that were deleted do not count)
  message: string | null; // null when nothing changed
};

export function criticalIds(tasks: ScheduledTask[]): Set<string> {
  return new Set(tasks.filter((t) => t.critical).map((t) => t.id));
}

function list(names: string[]): string {
  return names.join(", ");
}

/** `before` is the set of critical task ids from the previous schedule, or null the first time. */
export function criticalChange(before: Set<string> | null, after: ScheduledTask[]): CriticalChange {
  if (!before) return { became: [], stopped: [], message: null };
  const became = after.filter((t) => t.critical && !before.has(t.id)).map((t) => t.name);
  const stopped = after.filter((t) => !t.critical && before.has(t.id)).map((t) => t.name);

  const parts: string[] = [];
  if (became.length) parts.push(`${list(became)} ${became.length > 1 ? "are" : "is"} now critical`);
  if (stopped.length) parts.push(`${list(stopped)} ${stopped.length > 1 ? "are" : "is"} no longer critical`);
  return { became, stopped, message: parts.length ? `${parts.join(". ")}.` : null };
}
