import { Button } from "@/components/ui/button";

/**
 * A plan with no tasks yet: instead of a blank card, a ghost of what will appear (three tasks in a
 * row on the amber path and a task on a side branch) and the two ways to start: the example tasks,
 * or your own first task.
 */
export function EmptyPlan({ onExample, onFirstTask }: { onExample: () => void; onFirstTask: () => void }) {
  return (
    <div className="grid min-h-[300px] flex-1 place-items-center px-4 py-8">
      <div className="fp-enter grid max-w-[460px] justify-items-center gap-2.5 text-center">
        <svg viewBox="0 0 360 150" aria-hidden="true" className="h-auto w-[min(360px,100%)]">
          <defs>
            <marker id="fp-ghost-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0 1L9 5L0 9z" fill="var(--primary)" />
            </marker>
          </defs>
          <g fill="none" strokeWidth="2" strokeDasharray="5 5">
            <rect x="8" y="42" width="86" height="46" rx="10" stroke="var(--primary)" />
            <rect x="138" y="42" width="86" height="46" rx="10" stroke="var(--primary)" />
            <rect x="268" y="42" width="86" height="46" rx="10" stroke="var(--primary)" />
            <rect x="138" y="102" width="86" height="40" rx="10" stroke="var(--line-strong)" />
          </g>
          <g fill="none" strokeLinecap="round">
            <path d="M94 65H136" stroke="var(--primary)" strokeWidth="3" markerEnd="url(#fp-ghost-arrow)" pathLength={1} className="fp-draw" />
            <path d="M224 65H266" stroke="var(--primary)" strokeWidth="3" markerEnd="url(#fp-ghost-arrow)" pathLength={1} className="fp-draw" style={{ animationDelay: "0.5s" }} />
            <path d="M60 88C60 118 90 122 136 122" stroke="var(--line-strong)" strokeWidth="2.5" pathLength={1} className="fp-draw" style={{ animationDelay: "0.9s" }} />
          </g>
          <g fill="var(--muted-foreground)" fontSize="12" fontWeight="600" textAnchor="middle">
            <text x="51" y="69">Design</text>
            <text x="181" y="69">Build</text>
            <text x="311" y="69">Ship</text>
            <text x="181" y="126">Docs</text>
          </g>
        </svg>
        <h2 className="text-xl font-bold tracking-tight">Your route appears here</h2>
        <p className="text-muted-foreground">
          Add tasks and what each one waits for. FlowPlan draws the path and lights up the tasks that cannot slip.
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-2.5">
          <Button onClick={onExample}>Add the example tasks</Button>
          <Button variant="outline" onClick={onFirstTask}>
            Add your first task
          </Button>
        </div>
      </div>
    </div>
  );
}
