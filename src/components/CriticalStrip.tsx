import { endDateOf, formatDate, startDateOf } from "@/lib/plan";
import type { ScheduledTask } from "@/lib/scheduler";
import { cn } from "@/lib/utils";

/**
 * The critical path as a route line at the foot of the diagram card: an amber line joining the
 * tasks that decide the finish date, with their dates. Horizontal on a laptop, a vertical list on a
 * phone (where it is the last thing on the page). A finished task's station turns green.
 */
export function CriticalStrip({ tasks, startDate }: { tasks: ScheduledTask[]; startDate: string }) {
  const critical = tasks.filter((t) => t.critical);
  if (critical.length === 0) return null;

  return (
    <div className="border-t border-border bg-g0/30 px-5 pt-4 pb-[18px]">
      <div className="mb-3.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-[17px] font-bold tracking-tight">Critical path</h2>
        <p className="text-[13px] text-muted-foreground">These tasks cannot slip. Everything else has slack.</p>
      </div>
      <ol className="m-0 flex list-none gap-0 overflow-x-auto p-0 max-[520px]:flex-col">
        {critical.map((t, i) => (
          <li
            key={t.id}
            className={cn(
              "relative flex-[1_0_118px] pt-5 text-sm [overflow-wrap:anywhere] max-[520px]:flex-none max-[520px]:pt-0 max-[520px]:pr-0 max-[520px]:pb-4 max-[520px]:pl-7",
              // the amber line to the next station
              "before:absolute before:top-1.5 before:right-[-6px] before:left-1.5 before:h-0.5 before:bg-primary/85 before:content-['']",
              i === critical.length - 1 && "before:right-[calc(100%-6px)] max-[520px]:before:hidden",
              "max-[520px]:before:top-3.5 max-[520px]:before:right-auto max-[520px]:before:bottom-[-2px] max-[520px]:before:left-1.5 max-[520px]:before:h-auto max-[520px]:before:w-0.5",
            )}
          >
            <span
              className={cn(
                "absolute top-0 left-0 size-3.5 rounded-full border-[3px] bg-g1 transition-colors max-[520px]:top-[3px]",
                t.done ? "border-done bg-done" : "border-primary",
              )}
              aria-hidden="true"
            />
            <span className="block font-semibold">
              {t.name}
              {t.done && <span className="sr-only"> (done)</span>}
            </span>
            <span className="block font-mono text-xs text-muted-foreground">
              {formatDate(startDateOf(startDate, t.es), false)} to {formatDate(endDateOf(startDate, t.ef), false)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
