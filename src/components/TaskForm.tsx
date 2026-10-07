"use client";

import { useId, useRef, useState } from "react";
import { MAX_NOTES, validateTask, type TaskErrors, type TaskInput } from "@/lib/plan";
import type { Task } from "@/lib/scheduler";
import { DependencyPicker } from "./DependencyPicker";

type Props = {
  tasks: Task[]; // every task in the project, used for dependency options and the loop check
  initial?: Task; // set when editing
  onSave: (task: Task) => void;
  onCancel?: () => void;
  nameInputId?: string;
  autoFocus?: boolean;
};

function toInput(task?: Task): TaskInput {
  return {
    name: task?.name ?? "",
    duration: task ? String(task.duration) : "",
    owner: task?.owner ?? "",
    dependsOn: task?.dependsOn ?? [],
    notes: task?.notes ?? "",
  };
}

/** Add or edit one task. Invalid input or a loop blocks the save with an inline message. */
export function TaskForm({ tasks, initial, onSave, onCancel, nameInputId, autoFocus }: Props) {
  const uid = useId();
  const nameId = nameInputId ?? `${uid}-name`;
  const nameRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState<TaskInput>(() => toInput(initial));
  const [errors, setErrors] = useState<TaskErrors>({});

  function set<K extends keyof TaskInput>(key: K, value: TaskInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const result = validateTask(input, tasks, initial?.id);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    onSave(result.task);
    if (!initial) {
      setInput(toInput());
      setErrors({});
      nameRef.current?.focus();
    }
  }

  return (
    <form className="task-form" onSubmit={submit} noValidate>
      <div className="field field-name">
        <label htmlFor={nameId}>Task</label>
        <input
          ref={nameRef}
          id={nameId}
          className="input"
          placeholder="e.g. Backend API"
          value={input.name}
          autoFocus={autoFocus}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? `${uid}-name-err` : undefined}
          onChange={(e) => set("name", e.target.value)}
        />
        {errors.name && (
          <span id={`${uid}-name-err`} className="field-error">
            {errors.name}
          </span>
        )}
      </div>

      <div className="field">
        <label htmlFor={`${uid}-dur`}>Days</label>
        <input
          id={`${uid}-dur`}
          className="input num"
          inputMode="numeric"
          placeholder="3"
          value={input.duration}
          aria-invalid={!!errors.duration}
          aria-describedby={errors.duration ? `${uid}-dur-err` : undefined}
          onChange={(e) => set("duration", e.target.value)}
        />
        {errors.duration && (
          <span id={`${uid}-dur-err`} className="field-error">
            {errors.duration}
          </span>
        )}
      </div>

      <div className="field">
        <label htmlFor={`${uid}-owner`}>Owner (optional)</label>
        <input
          id={`${uid}-owner`}
          className="input"
          placeholder="e.g. Sara"
          value={input.owner}
          onChange={(e) => set("owner", e.target.value)}
        />
      </div>

      <div className="field field-deps">
        <label htmlFor={`${uid}-deps`}>Waits for</label>
        <DependencyPicker
          id={`${uid}-deps`}
          tasks={tasks}
          selfId={initial?.id}
          value={input.dependsOn}
          invalid={!!errors.dependsOn}
          onChange={(ids) => set("dependsOn", ids)}
        />
        {errors.dependsOn && (
          <span className="field-error" role="alert">
            {errors.dependsOn}
          </span>
        )}
      </div>

      <div className="field field-notes">
        <label htmlFor={`${uid}-notes`}>Notes (optional)</label>
        <textarea
          id={`${uid}-notes`}
          className="input"
          rows={2}
          maxLength={MAX_NOTES}
          placeholder="Links, decisions, blockers…"
          value={input.notes}
          aria-invalid={!!errors.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
        {errors.notes && <span className="field-error">{errors.notes}</span>}
      </div>

      <div className="form-actions">
        <button className="btn btn-primary" type="submit">
          {initial ? "Save" : "Add task"}
        </button>
        {onCancel && (
          <button className="btn" type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
