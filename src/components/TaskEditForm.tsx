"use client";

import { useId, useMemo, useState } from "react";
import { WaitsForOptions } from "@/components/WaitsForPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { loopIfWaitsFor, MAX_NOTES, validateTask, type TaskErrors, type TaskInput } from "@/lib/plan";
import type { Task } from "@/lib/scheduler";

type Props = {
  task: Task; // the task being edited
  tasks: Task[]; // every task in the plan
  onSave: (task: Task) => void;
  onCancel: () => void;
  onDelete: () => void;
};

/**
 * Edit one task: name, days, owner, what it waits for, notes. Waits-for options that would create
 * a loop are switched off with the loop spelled out; if one still gets through (two choices that
 * only loop together), saving refuses and names the loop, as in version 1.
 */
export function TaskEditForm({ task, tasks, onSave, onCancel, onDelete }: Props) {
  const uid = useId();
  const [input, setInput] = useState<TaskInput>({
    name: task.name,
    duration: String(task.duration),
    owner: task.owner ?? "",
    dependsOn: task.dependsOn,
    notes: task.notes ?? "",
  });
  const [errors, setErrors] = useState<TaskErrors>({});

  const loopReasons = useMemo(() => {
    const reasons: Record<string, string> = {};
    for (const other of tasks) {
      if (other.id === task.id || task.dependsOn.includes(other.id)) continue;
      const reason = loopIfWaitsFor(tasks, task.id, other.id);
      if (reason) reasons[other.id] = reason;
    }
    return reasons;
  }, [tasks, task]);

  function set<K extends keyof TaskInput>(key: K, value: TaskInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const result = validateTask(input, tasks, task.id);
    if (!result.ok) return setErrors(result.errors);
    onSave(result.task);
  }

  const err = (text?: string, id?: string) =>
    text && (
      <p id={id} role="alert" className="text-sm font-semibold text-destructive">
        {text}
      </p>
    );

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor={`${uid}-name`}>Task</Label>
        <Input
          id={`${uid}-name`}
          value={input.name}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? `${uid}-name-err` : undefined}
          onChange={(e) => set("name", e.target.value)}
        />
        {err(errors.name, `${uid}-name-err`)}
      </div>

      <div className="grid grid-cols-2 gap-3 max-[360px]:grid-cols-1">
        <div className="grid gap-2">
          <Label htmlFor={`${uid}-days`}>Days</Label>
          <Input
            id={`${uid}-days`}
            inputMode="numeric"
            value={input.duration}
            aria-invalid={!!errors.duration}
            aria-describedby={errors.duration ? `${uid}-days-err` : undefined}
            onChange={(e) => set("duration", e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${uid}-owner`}>Owner (optional)</Label>
          <Input id={`${uid}-owner`} value={input.owner} placeholder="e.g. Sara" onChange={(e) => set("owner", e.target.value)} />
        </div>
      </div>
      {err(errors.duration, `${uid}-days-err`)}

      <div className="grid gap-2">
        <span className="text-sm leading-none font-medium">Waits for</span>
        <div className="max-h-52 overflow-auto rounded-xl border border-input bg-g0/40 p-1.5">
          <WaitsForOptions
            tasks={tasks}
            selfId={task.id}
            value={input.dependsOn}
            disabledReasons={loopReasons}
            onChange={(ids) => set("dependsOn", ids)}
          />
        </div>
        {err(errors.dependsOn)}
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${uid}-notes`}>Notes (optional)</Label>
        <Textarea
          id={`${uid}-notes`}
          rows={3}
          maxLength={MAX_NOTES}
          placeholder="Links, decisions, blockers…"
          value={input.notes}
          aria-invalid={!!errors.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
        {err(errors.notes)}
      </div>

      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        <Button type="submit">Save</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <span className="flex-1" />
        <Button type="button" variant="destructive" onClick={onDelete}>
          Delete task
        </Button>
      </div>
    </form>
  );
}
