"use client";

import { useRef, useState } from "react";
import { WaitsForPicker } from "@/components/WaitsForPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validateTask, type TaskErrors } from "@/lib/plan";
import type { Task } from "@/lib/scheduler";

export const QUICK_ADD_INPUT = "add-task-name";

/**
 * The add-a-task bar at the top of a plan: name, days, what it waits for. Several tasks in a row
 * is one keystroke each: Enter saves and the cursor stays in the name field.
 * Owner and notes are added later in the edit dialog.
 */
export function QuickAdd({ tasks, onSave }: { tasks: Task[]; onSave: (task: Task) => void }) {
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [days, setDays] = useState("2");
  const [waits, setWaits] = useState<string[]>([]);
  const [errors, setErrors] = useState<TaskErrors>({});

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const result = validateTask({ name, duration: days, owner: "", dependsOn: waits, notes: "" }, tasks);
    if (!result.ok) return setErrors(result.errors);
    onSave(result.task);
    setName("");
    setWaits([]);
    setErrors({});
    nameRef.current?.focus();
  }

  const message = errors.name ?? errors.duration ?? errors.dependsOn;

  return (
    <form onSubmit={submit} noValidate autoComplete="off" className="mb-[18px] print:hidden">
      <div className="flex flex-wrap gap-2.5">
        <Input
          ref={nameRef}
          id={QUICK_ADD_INPUT}
          aria-label="Task name"
          placeholder="Add a task"
          value={name}
          aria-invalid={!!errors.name}
          className="min-w-[220px] flex-1"
          onChange={(e) => {
            setName(e.target.value);
            setErrors({});
          }}
        />
        <label className="flex h-11 items-center gap-2.5 rounded-xl border border-input bg-g0/55 pr-2 pl-3.5 text-sm text-muted-foreground">
          Days
          <input
            inputMode="numeric"
            value={days}
            aria-invalid={!!errors.duration}
            onChange={(e) => {
              setDays(e.target.value);
              setErrors({});
            }}
            className="h-10 w-12 bg-transparent text-foreground"
          />
        </label>
        <WaitsForPicker tasks={tasks} value={waits} onChange={setWaits} />
        <Button type="submit">Add task</Button>
      </div>
      {message && (
        <p role="alert" className="mt-2 text-sm font-semibold text-destructive">
          {message}
        </p>
      )}
    </form>
  );
}
