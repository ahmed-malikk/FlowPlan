"use client";

import { Minus, Plus } from "lucide-react";
import { useRef } from "react";
import { endDateOf, formatDate, MAX_DURATION, startDateOf } from "@/lib/plan";
import { SlackChip } from "@/components/SlackChip";
import type { ScheduledTask, Task } from "@/lib/scheduler";
import { cn } from "@/lib/utils";

type Props = {
  tasks: Task[]; // in the order the visitor entered them
  scheduled: Map<string, ScheduledTask> | null; // null when the plan has a loop
  startDate: string;
  onDuration: (id: string, duration: number) => void;
  onDone: (id: string, done: boolean) => void;
  onEdit: (id: string, opener: HTMLElement) => void; // opener gets focus back when the dialog closes
  onDelete: (id: string) => void;
  onHighlight?: (id: string | null) => void; // lets the diagram light up what a task waits for
};

/**
 * The tasks, one row each: done box, name with critical or slack chip, what it waits for and when,
 * a what-if stepper and Edit. On a phone each row is two lines and can be swiped: right marks it
 * done, left deletes it (with Undo). Every swipe action also has a button, so nothing depends on it.
 */
export function TasksList({ tasks, scheduled, startDate, onDuration, onDone, onEdit, onDelete, onHighlight }: Props) {
  const names = new Map(tasks.map((t) => [t.id, t.name]));

  return (
    <ul className="m-0 list-none p-0" onMouseLeave={() => onHighlight?.(null)}>
      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          timing={scheduled?.get(task.id)}
          startDate={startDate}
          waitsFor={task.dependsOn.map((d) => names.get(d)).filter(Boolean) as string[]}
          onDuration={onDuration}
          onDone={onDone}
          onEdit={onEdit}
          onDelete={onDelete}
          onHighlight={onHighlight}
        />
      ))}
    </ul>
  );
}

function TaskRow({
  task,
  timing,
  startDate,
  waitsFor,
  onDuration,
  onDone,
  onEdit,
  onDelete,
  onHighlight,
}: {
  task: Task;
  timing?: ScheduledTask;
  startDate: string;
  waitsFor: string[];
  onDuration: Props["onDuration"];
  onDone: Props["onDone"];
  onEdit: Props["onEdit"];
  onDelete: Props["onDelete"];
  onHighlight?: Props["onHighlight"];
}) {
  const row = useRef<HTMLLIElement>(null);
  const swipe = useSwipe(row, () => onDone(task.id, !task.done), () => onDelete(task.id));

  const when = timing
    ? `${formatDate(startDateOf(startDate, timing.es), false)} to ${formatDate(endDateOf(startDate, timing.ef), false)}`
    : null;
  const sub = [task.owner, waitsFor.length ? `after ${waitsFor.join(", ")}` : "starts on day 0", when].filter(Boolean).join(", ");

  return (
    <li
      ref={row}
      data-id={task.id}
      {...swipe}
      className="grid touch-pan-y grid-cols-[44px_1fr_auto_auto] items-center gap-x-2 border-b border-border/70 py-2.5 max-[520px]:grid-cols-[44px_1fr_auto]"
      onMouseEnter={() => onHighlight?.(task.id)}
      onFocus={(e) => e.target.matches(":focus-visible") && onHighlight?.(task.id)}
      onBlur={() => onHighlight?.(null)}
    >
      <label className="-mx-1.5 grid size-11 cursor-pointer place-items-center max-[520px]:row-span-1">
        <input
          type="checkbox"
          checked={!!task.done}
          onChange={(e) => onDone(task.id, e.target.checked)}
          aria-label={`Mark ${task.name} as done`}
          className="size-5 accent-primary"
        />
      </label>

      <div className="min-w-0 max-[520px]:col-span-2">
        <span className={cn("break-words font-semibold", task.done && "text-muted-foreground line-through")}>{task.name}</span>{" "}
        {timing &&
          (timing.critical ? (
            <span className="inline-flex rounded-full border border-primary/50 bg-amber-soft px-2.5 py-0.5 text-xs whitespace-nowrap text-amber-text">
              critical
            </span>
          ) : (
            <SlackChip days={timing.slack} />
          ))}
        <span className="mt-0.5 block text-[12.5px] break-words text-muted-foreground">{sub}</span>
        {task.notes && (
          <span className="mt-0.5 line-clamp-1 block text-[12.5px] text-muted-foreground" title={task.notes}>
            {task.notes}
          </span>
        )}
      </div>

      <Stepper
        name={task.name}
        value={task.duration}
        onChange={(d) => onDuration(task.id, d)}
        className="max-[520px]:col-start-2 max-[520px]:row-start-2 max-[520px]:mt-1.5 max-[520px]:justify-self-start"
      />

      <button
        type="button"
        onClick={(e) => onEdit(task.id, e.currentTarget)}
        aria-label={`Edit ${task.name}`}
        className="min-h-9 min-w-11 rounded-md px-1.5 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground max-[520px]:col-start-3 max-[520px]:row-start-2 max-[520px]:mt-1.5 max-[520px]:min-h-11 max-[520px]:justify-self-end"
      >
        Edit
      </button>
    </li>
  );
}

/** The what-if control: one day more or less, so the whole plan can be tried out. */
function Stepper({ name, value, onChange, className }: { name: string; value: number; onChange: (d: number) => void; className?: string }) {
  const btn =
    "grid size-[30px] place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-35 max-[520px]:size-10";
  return (
    <span className={cn("inline-flex items-center rounded-full border border-input", className)}>
      <button type="button" className={btn} disabled={value <= 1} aria-label={`One day less for ${name}`} onClick={() => onChange(value - 1)}>
        <Minus className="size-3.5" aria-hidden="true" />
      </button>
      <span className="min-w-[26px] text-center font-mono text-[13px] max-[520px]:min-w-[30px]">{value}</span>
      <button type="button" className={btn} disabled={value >= MAX_DURATION} aria-label={`One day more for ${name}`} onClick={() => onChange(value + 1)}>
        <Plus className="size-3.5" aria-hidden="true" />
      </button>
    </span>
  );
}

/** Touch swipe on a row: right = done, left = delete. Vertical scrolling is never blocked. */
function useSwipe(ref: React.RefObject<HTMLLIElement | null>, onRight: () => void, onLeft: () => void) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const dx = useRef(0);
  const locked = useRef(false);

  const reset = () => {
    const el = ref.current;
    if (el) {
      el.style.transform = "";
      el.style.background = "";
    }
  };

  return {
    onTouchStart(e: React.TouchEvent) {
      // Buttons, boxes and links keep their own taps.
      if ((e.target as HTMLElement).closest("button, input, label, a")) return void (start.current = null);
      start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      dx.current = 0;
      locked.current = false;
    },
    onTouchMove(e: React.TouchEvent) {
      const s = start.current;
      const el = ref.current;
      if (!s || !el) return;
      const x = e.touches[0].clientX - s.x;
      const y = e.touches[0].clientY - s.y;
      if (!locked.current && Math.abs(y) > Math.abs(x) && Math.abs(y) > 8) return void (start.current = null);
      if (Math.abs(x) > 10) locked.current = true;
      if (!locked.current) return;
      dx.current = Math.max(-120, Math.min(120, x));
      el.style.transform = `translateX(${dx.current}px)`;
      el.style.background = dx.current > 0 ? "rgba(79,209,165,0.14)" : "rgba(255,122,122,0.14)";
    },
    onTouchEnd() {
      if (!start.current) return;
      const moved = dx.current;
      reset();
      start.current = null;
      if (moved > 80) onRight();
      else if (moved < -80) onLeft();
    },
  };
}
