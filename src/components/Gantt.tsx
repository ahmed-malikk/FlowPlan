import { endDateOf, formatDate, startDateOf } from "@/lib/plan";
import type { ScheduledTask } from "@/lib/scheduler";

type Props = {
  tasks: ScheduledTask[]; // topological order, so every bar sits below what it waits for
  finish: number;
  startDate: string;
};

/** Picks a tick spacing that gives at most ~14 labels on the day axis. */
function tickStep(finish: number): number {
  for (const step of [1, 2, 5, 7, 10, 14, 20, 30, 50, 100]) if (finish / step <= 14) return step;
  return Math.ceil(finish / 14 / 100) * 100;
}

/** Gantt chart: critical tasks in red, others in green with their slack as a dashed box. */
export function Gantt({ tasks, finish, startDate }: Props) {
  const span = Math.max(finish, 1);
  const pct = (day: number) => `${(day / span) * 100}%`;
  const step = tickStep(span);
  const ticks: number[] = [];
  for (let d = 0; d <= span; d += step) ticks.push(d);
  if (ticks[ticks.length - 1] !== span) ticks.push(span);

  const grid = (
    <div className="gantt-grid" aria-hidden>
      {ticks.map((d) => (
        <span key={d} style={{ left: pct(d) }} />
      ))}
    </div>
  );

  return (
    <div className="gantt">
      <div className="gantt-scroll">
        <div className="gantt-inner" role="img" aria-label={ariaSummary(tasks, finish)}>
          <div className="gantt-row gantt-axis" aria-hidden>
            <div className="gantt-label muted small">Day</div>
            <div className="gantt-track">
              {ticks.map((d, i) => (
                <span
                  key={d}
                  className="gantt-tick"
                  // Keep the last label from colliding with the one before it.
                  style={{ left: pct(d), ...(i === ticks.length - 1 && d - ticks[i - 1] < step / 2 ? { display: "none" } : {}) }}
                >
                  {d}
                </span>
              ))}
            </div>
          </div>

          {tasks.map((t) => (
            <div key={t.id} className="gantt-row">
              <div className={`gantt-label${t.critical ? " is-critical" : ""}`} title={t.name}>
                {t.name}
              </div>
              <div className="gantt-track">
                {grid}
                <div
                  className={`gantt-bar${t.critical ? " is-critical" : ""}${t.done ? " is-done" : ""}`}
                  style={{ left: pct(t.es), width: pct(t.duration) }}
                  title={`${t.name}: ${formatDate(startDateOf(startDate, t.es), false)} – ${formatDate(
                    endDateOf(startDate, t.ef),
                    false,
                  )} (day ${t.es}–${t.ef}, ${t.duration}d)${t.critical ? " · critical" : ` · ${t.slack}d slack`}${t.done ? " · done" : ""}`}
                >
                  <span className="gantt-bar-text">{t.done ? "✓ " : ""}{t.duration}d</span>
                </div>
                {t.slack > 0 && (
                  <div
                    className="gantt-slack"
                    style={{ left: pct(t.ef), width: pct(t.slack) }}
                    title={`Can slip ${t.slack} day${t.slack === 1 ? "" : "s"} without moving the finish date`}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="legend">
        <span>
          <i className="l-critical" />
          Critical (zero slack)
        </span>
        <span>
          <i className="l-slack-bar" />
          Has slack
        </span>
        <span>
          <i className="l-slack" />
          How far it can slip
        </span>
      </div>
    </div>
  );
}

function ariaSummary(tasks: ScheduledTask[], finish: number): string {
  const critical = tasks.filter((t) => t.critical).map((t) => t.name);
  return `Timeline of ${tasks.length} tasks over ${finish} days. Critical path: ${critical.join(", ")}.`;
}
