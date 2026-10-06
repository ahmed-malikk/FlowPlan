import { endDateOf, formatDate } from "@/lib/plan";
import type { ScheduleResult } from "@/lib/scheduler";

type Props = {
  result: ScheduleResult;
  startDate: string;
  taskCount: number;
  baselineFinish: number | null; // finish when the page opened, to show what-if changes
};

/** Total duration, finish date, critical path and any warnings. */
export function SummaryPanel({ result, startDate, taskCount, baselineFinish }: Props) {
  const warnings = result.warnings;

  if (!result.ok) {
    return (
      <div className="card summary stack">
        <h2 style={{ margin: 0 }}>Summary</h2>
        <div className="alert alert-error">
          <strong>This plan can&apos;t be scheduled.</strong> {warnings.join(" ")}
        </div>
      </div>
    );
  }

  const { finish, tasks } = result;
  const critical = tasks.filter((t) => t.critical);
  const delta = baselineFinish === null ? 0 : finish - baselineFinish;
  // Arrows only make sense when the critical tasks form one chain (not two parallel critical paths).
  const isChain = critical.every((t, i) => i === 0 || t.dependsOn.includes(critical[i - 1].id));

  return (
    <div className="card summary">
      <h2 style={{ marginBottom: 4 }}>Summary</h2>

      <div className="stat">
        <div className="stat-label">Finish date</div>
        <div className="stat-value">{taskCount ? formatDate(endDateOf(startDate, finish)) : "—"}</div>
        <div className="stat-sub">Starts {formatDate(startDate)}</div>
      </div>

      <div className="stat">
        <div className="stat-label">Total duration</div>
        <div className="stat-value num">
          {finish} day{finish === 1 ? "" : "s"}
          {delta !== 0 && (
            <span
              className="chip num"
              style={{
                marginLeft: 8,
                verticalAlign: "middle",
                background: delta > 0 ? "var(--critical-soft)" : "var(--accent-soft)",
                color: delta > 0 ? "var(--critical)" : "var(--slack)",
              }}
              title="Change since you opened this project"
            >
              {delta > 0 ? "+" : "−"}
              {Math.abs(delta)}d
            </span>
          )}
        </div>
      </div>

      <div className="stat">
        <div className="stat-label">Critical tasks</div>
        <div className="stat-value num">
          {critical.length} <span className="stat-sub">of {taskCount}</span>
        </div>
        {critical.length > 0 && (
          <div className="path" aria-label="Critical path">
            {critical.map((t, i) => (
              <span key={t.id} className="row" style={{ gap: 4 }}>
                {i > 0 && isChain && <span className="muted">→</span>}
                <span className="chip">{t.name}</span>
              </span>
            ))}
          </div>
        )}
        {critical.length > 0 && (
          <div className="stat-sub" style={{ marginTop: 6 }}>
            A delay on any of these moves the finish date.
          </div>
        )}
      </div>

      {warnings.length > 0 && (
        <div className="stack" style={{ gap: 8, marginTop: 12 }}>
          {warnings.map((w, i) => (
            <div key={i} className="alert alert-warn small">
              {w}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
