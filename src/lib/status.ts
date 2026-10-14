/**
 * The one status line under a plan's title: when it finishes and how many tasks decide that.
 * Pure function, so the wording is tested and the screen reader announcement matches the screen.
 */
import { endDateOf, formatShortDate } from "./plan";
import type { ScheduleResult, Task } from "./scheduler";

export type Status = {
  finishDate: string | null; // short date such as "25 Oct", or null when there is none
  text: string; // the sentence next to it
};

export function statusLine(startDate: string, tasks: Task[], result: ScheduleResult): Status {
  if (tasks.length === 0) {
    return { finishDate: null, text: "No tasks yet. Add the first one and the critical path appears here." };
  }
  if (!result.ok) {
    return { finishDate: null, text: "This plan has a loop, so there is no finish date yet." };
  }
  const done = tasks.filter((t) => t.done).length;
  const finishDate = formatShortDate(endDateOf(startDate, result.finish));
  if (done === tasks.length) {
    return { finishDate, text: `All ${tasks.length} ${tasks.length === 1 ? "task is" : "tasks are"} done.` };
  }
  const critical = result.tasks.filter((t) => t.critical).length;
  return { finishDate, text: `Finishes on day ${result.finish}. ${critical} of ${tasks.length} tasks are critical, ${done} done.` };
}
