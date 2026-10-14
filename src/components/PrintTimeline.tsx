import { Check } from "lucide-react";
import { endDateOf, formatDate, startDateOf } from "@/lib/plan";
import type { ScheduledTask } from "@/lib/scheduler";
import { dayTicks } from "@/lib/timeline";
import { cn } from "@/lib/utils";

type Props = {
  tasks: ScheduledTask[]; // topological order, so every bar sits below what it waits for
  finish: number;
  startDate: string;
};

/**
 * The timeline for the printed page (a diagram is for the screen, a timeline is for paper).
 * Critical tasks are solid and bold; tasks with slack are light with a dashed box showing how far
 * they can slip, so the page reads in black and white too. Colours are forced on so a browser
 * does not drop the bars when "background graphics" is off.
 */
export function PrintTimeline({ tasks, finish, startDate }: Props) {
  const span = Math.max(finish, 1);
  const pct = (day: number) => `${(day / span) * 100}%`;
  const ticks = dayTicks(span);
  const critical = tasks.filter((t) => t.critical).map((t) => t.name);

  return (
    <div className="print-exact mt-6 text-[13px]">
      <h2 className="mb-2 text-base font-bold">Timeline</h2>
      <div role="img" aria-label={`Timeline of ${tasks.length} tasks over ${finish} days. Critical path: ${critical.join(", ")}.`}>
        <div className="grid grid-cols-[160px_1fr] items-center" aria-hidden="true">
          <div className="text-muted-foreground">Day</div>
          <div className="relative h-6">
            {ticks.map((t) =>
              t.label ? (
                <span key={t.day} className="absolute top-1 -translate-x-1/2 font-mono text-[11px] text-muted-foreground" style={{ left: pct(t.day) }}>
                  {t.day}
                </span>
              ) : null,
            )}
          </div>
        </div>

        {tasks.map((t) => (
          <div key={t.id} className="grid min-h-[34px] grid-cols-[160px_1fr] items-center break-inside-avoid">
            <div className={cn("truncate pr-3", t.critical && "font-bold")}>{t.name}</div>
            <div className="relative h-[34px]">
              {ticks.map((tick) => (
                <span key={tick.day} className="absolute inset-y-0 border-l border-border" style={{ left: pct(tick.day) }} aria-hidden="true" />
              ))}
              <div
                className={cn(
                  "absolute top-2 flex h-[18px] min-w-[3px] items-center gap-1 overflow-hidden rounded px-1.5 text-[11px] font-semibold",
                  t.critical ? "bg-primary text-primary-foreground" : "border border-slack bg-slack/30 text-foreground",
                  t.done && "opacity-55",
                )}
                style={{ left: pct(t.es), width: pct(t.duration) }}
                title={`${t.name}: ${formatDate(startDateOf(startDate, t.es), false)} to ${formatDate(endDateOf(startDate, t.ef), false)}`}
              >
                {t.done && <Check className="size-3 shrink-0" aria-hidden="true" />}
                <span className="truncate">{t.duration}d</span>
              </div>
              {t.slack > 0 && (
                <div
                  className="absolute top-3 h-2.5 rounded-r border-[1.5px] border-l-0 border-dashed border-slack"
                  style={{ left: pct(t.ef), width: pct(t.slack) }}
                />
              )}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <i className="inline-block h-3 w-5 rounded-sm bg-primary" /> Critical (zero slack)
        </span>
        <span className="flex items-center gap-1.5">
          <i className="inline-block h-3 w-5 rounded-sm border border-slack bg-slack/30" /> Has slack
        </span>
        <span className="flex items-center gap-1.5">
          <i className="inline-block h-2.5 w-5 rounded-r border-[1.5px] border-l-0 border-dashed border-slack" /> How far it can slip
        </span>
      </p>
    </div>
  );
}
