"use client";

import { cn } from "@/lib/utils";

export type View = "tasks" | "diagram";

/**
 * Phone and tablet only: Tasks and Diagram are one thumb-tap apart instead of one long scroll.
 * On wide screens both are on the page at once, so this switch is hidden.
 */
export function ViewSwitch({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  return (
    <div
      role="group"
      aria-label="Show"
      className="mb-3.5 flex gap-1 rounded-full border border-input bg-g0/50 p-1 min-[901px]:hidden print:hidden"
    >
      {(["tasks", "diagram"] as const).map((v) => (
        <button
          key={v}
          type="button"
          aria-pressed={view === v}
          onClick={() => onChange(v)}
          className={cn(
            "h-11 flex-1 rounded-full font-semibold text-muted-foreground transition-colors",
            view === v && "bg-primary text-primary-foreground",
          )}
        >
          {v === "tasks" ? "Tasks" : "Diagram"}
        </button>
      ))}
    </div>
  );
}
