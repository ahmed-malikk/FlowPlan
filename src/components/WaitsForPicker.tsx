"use client";

import { ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Task } from "@/lib/scheduler";
import { cn } from "@/lib/utils";

type ListProps = {
  tasks: Task[]; // every task in the plan
  value: string[]; // ids this task waits for
  onChange: (ids: string[]) => void;
  selfId?: string; // the task being edited, which can't wait for itself
  disabledReasons?: Record<string, string>; // option id -> why it can't be chosen (a loop)
};

/** What the closed control says: the one task, how many, or nothing. */
export function waitsForLabel(tasks: Task[], value: string[]): string {
  const names = value.map((id) => tasks.find((t) => t.id === id)?.name).filter(Boolean) as string[];
  if (names.length === 0) return "Nothing";
  if (names.length === 1) return names[0];
  return `${names.length} tasks`;
}

/**
 * The checkbox list itself: only task names. An option that would create a loop is switched off
 * and says which loop, so the plan can never be broken by clicking.
 */
export function WaitsForOptions({ tasks, value, onChange, selfId, disabledReasons = {} }: ListProps) {
  const options = tasks.filter((t) => t.id !== selfId);

  function toggle(id: string, on: boolean) {
    onChange(on ? [...new Set([...value, id])] : value.filter((v) => v !== id));
  }

  if (options.length === 0) return <p className="px-2 py-2 text-sm text-muted-foreground">No other tasks yet.</p>;

  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="sr-only">Waits for</legend>
      {options.map((t) => {
        const reason = disabledReasons[t.id];
        return (
          <label
            key={t.id}
            className={cn(
              "flex min-h-11 items-start gap-3 rounded-lg px-2.5 py-2 text-sm md:min-h-10",
              reason ? "cursor-not-allowed" : "cursor-pointer hover:bg-secondary",
            )}
          >
            <input
              type="checkbox"
              className="mt-0.5 size-5 shrink-0 accent-primary"
              checked={value.includes(t.id)}
              disabled={!!reason}
              onChange={(e) => toggle(t.id, e.target.checked)}
            />
            <span className="min-w-0">
              <span className={cn("block break-words", reason && "opacity-60")}>{t.name}</span>
              {reason && <span className="block text-xs text-muted-foreground">Would create a loop: {reason}</span>}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}

/**
 * "Waits for" in the quick-add bar: a pill that opens the list. The label says "Waits for" once;
 * the options are only task names.
 */
export function WaitsForPicker({ className, ...list }: ListProps & { className?: string }) {
  const options = list.tasks.filter((t) => t.id !== list.selfId);
  return (
    <Popover>
      <PopoverTrigger
        disabled={options.length === 0}
        className={cn(
          "flex h-11 max-w-full items-center gap-2.5 rounded-xl border border-input bg-g0/55 pr-2 pl-3.5 text-sm whitespace-nowrap text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
      >
        <span>Waits for</span>
        <span className="min-w-0 max-w-44 truncate text-foreground">{waitsForLabel(list.tasks, list.value)}</span>
        <ChevronDown className="size-4 shrink-0" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent className="max-h-72 overflow-auto">
        <WaitsForOptions {...list} />
      </PopoverContent>
    </Popover>
  );
}
