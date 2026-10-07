"use client";

import { useState } from "react";
import { dependentsOf, endDateOf, formatDate, MAX_DURATION, startDateOf } from "@/lib/plan";
import type { ScheduledTask, Task } from "@/lib/scheduler";
import { TaskForm } from "./TaskForm";

type Props = {
  tasks: Task[]; // in the order the user entered them
  scheduled: Map<string, ScheduledTask> | null; // null when the plan has a loop
  startDate: string;
  onSave: (task: Task) => void;
  onDelete: (id: string) => void;
  onDuration: (id: string, duration: number) => void;
  onDone: (id: string, done: boolean) => void;
};

export function TaskTable({ tasks, scheduled, startDate, onSave, onDelete, onDuration, onDone }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const names = new Map(tasks.map((t) => [t.id, t.name]));

  function confirmDelete(task: Task) {
    const waiting = dependentsOf(tasks, task.id);
    const message = waiting.length
      ? `Delete "${task.name}"?\n\n${waiting.map((t) => `"${t.name}"`).join(", ")} ${
          waiting.length === 1 ? "waits" : "wait"
        } for it. That dependency will be removed.`
      : `Delete "${task.name}"?`;
    if (window.confirm(message)) onDelete(task.id);
  }

  return (
    <div className="table-wrap">
      <table className="tasks">
        <thead>
          <tr>
            <th>Task</th>
            <th>Days</th>
            <th>Waits for</th>
            <th>Start</th>
            <th>Finish</th>
            <th>Slack</th>
            <th className="actions">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            if (task.id === editingId) {
              return (
                <tr key={task.id} className="editing-row">
                  <td colSpan={7}>
                    <TaskForm
                      tasks={tasks}
                      initial={task}
                      autoFocus
                      onSave={(t) => {
                        onSave(t);
                        setEditingId(null);
                      }}
                      onCancel={() => setEditingId(null)}
                    />
                  </td>
                </tr>
              );
            }
            const s = scheduled?.get(task.id);
            return (
              <tr
                key={task.id}
                className={[s?.critical && "is-critical", task.done && "is-done"].filter(Boolean).join(" ") || undefined}
              >
                <td>
                  <div className="task-cell">
                    <input
                      type="checkbox"
                      className="done-check"
                      aria-label={`Mark ${task.name} as done`}
                      checked={!!task.done}
                      onChange={(e) => onDone(task.id, e.target.checked)}
                    />
                    <div>
                      <div className="task-name">{task.name}</div>
                      {task.owner && <div className="small muted">{task.owner}</div>}
                    </div>
                  </div>
                </td>
                <td>
                  <div className="stepper" title="Change the duration to see the effect on the finish date">
                    <button
                      type="button"
                      aria-label={`One day less for ${task.name}`}
                      disabled={task.duration <= 1}
                      onClick={() => onDuration(task.id, task.duration - 1)}
                    >
                      −
                    </button>
                    <span>{task.duration}d</span>
                    <button
                      type="button"
                      aria-label={`One day more for ${task.name}`}
                      disabled={task.duration >= MAX_DURATION}
                      onClick={() => onDuration(task.id, task.duration + 1)}
                    >
                      +
                    </button>
                  </div>
                </td>
                <td>
                  {task.dependsOn.length === 0 ? (
                    <span className="muted">—</span>
                  ) : (
                    <span className="chips chips-scroll">
                      {task.dependsOn.map((d) => (
                        <span key={d} className="chip">
                          {names.get(d) ?? "deleted task"}
                        </span>
                      ))}
                    </span>
                  )}
                </td>
                {s ? (
                  <>
                    <td className="num" title={`Day ${s.es}`}>
                      <div>{formatDate(startDateOf(startDate, s.es), false)}</div>
                      <div className="small muted">day {s.es}</div>
                    </td>
                    <td className="num" title={`Day ${s.ef}`}>
                      <div>{formatDate(endDateOf(startDate, s.ef), false)}</div>
                      <div className="small muted">day {s.ef}</div>
                    </td>
                    <td>
                      {s.critical ? (
                        <span className="chip badge-critical">Critical</span>
                      ) : (
                        <span className="chip badge-slack num">
                          {s.slack} day{s.slack === 1 ? "" : "s"}
                        </span>
                      )}
                    </td>
                  </>
                ) : (
                  <td colSpan={3} className="muted small">
                    Fix the loop to see dates
                  </td>
                )}
                <td className="actions">
                  <button className="btn btn-sm btn-ghost" onClick={() => setEditingId(task.id)}>
                    Edit
                  </button>
                  <button className="btn btn-sm btn-ghost btn-danger" onClick={() => confirmDelete(task)}>
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
