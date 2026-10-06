"use client";

import { useEffect, useRef } from "react";
import type { Task } from "@/lib/scheduler";

type Props = {
  id: string;
  tasks: Task[];
  selfId?: string; // the task being edited: never offered, so a task can't depend on itself
  value: string[];
  onChange: (ids: string[]) => void;
  invalid?: boolean;
};

/** Multi-select of existing tasks, shown as a dropdown of checkboxes. */
export function DependencyPicker({ id, tasks, selfId, value, onChange, invalid }: Props) {
  const ref = useRef<HTMLDetailsElement>(null);
  const options = tasks.filter((t) => t.id !== selfId);
  const selected = options.filter((t) => value.includes(t.id));

  // Close when clicking outside or pressing Escape.
  useEffect(() => {
    function onPointer(e: PointerEvent) {
      if (ref.current?.open && !ref.current.contains(e.target as Node)) ref.current.open = false;
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && ref.current?.open) {
        ref.current.open = false;
        ref.current.querySelector("summary")?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function toggle(taskId: string) {
    onChange(value.includes(taskId) ? value.filter((v) => v !== taskId) : [...value, taskId]);
  }

  return (
    <details className="picker" ref={ref} aria-invalid={invalid}>
      <summary id={id}>
        {selected.length === 0 ? (
          <span className="muted">Nothing (can start on day 0)</span>
        ) : (
          <span className="chips">
            {selected.map((t) => (
              <span key={t.id} className="chip">
                {t.name}
              </span>
            ))}
          </span>
        )}
      </summary>
      <div className="picker-menu" role="group" aria-label="Depends on">
        {options.length === 0 ? (
          <div className="picker-empty">Add another task first, then pick what this one waits for.</div>
        ) : (
          options.map((t) => (
            <label key={t.id} className="picker-option">
              <input type="checkbox" checked={value.includes(t.id)} onChange={() => toggle(t.id)} />
              <span>{t.name}</span>
              <span className="spacer" />
              <span className="muted small num">{t.duration}d</span>
            </label>
          ))
        )}
      </div>
    </details>
  );
}
