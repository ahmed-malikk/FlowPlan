"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Gantt } from "@/components/Gantt";
import { SummaryPanel } from "@/components/SummaryPanel";
import { TaskForm } from "@/components/TaskForm";
import { TaskTable } from "@/components/TaskTable";
import { endDateOf, formatDate, isIsoDate, removeTask, setDone, setDuration, upsertTask } from "@/lib/plan";
import { schedule, type Project, type Task } from "@/lib/scheduler";
import { deleteProject, updateProject } from "@/lib/storage";
import { useProjects } from "@/lib/useProjects";

const ADD_TASK_INPUT = "add-task-name";
type View = "tasks" | "timeline";

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const projects = useProjects();

  if (projects === null) return <p className="muted">Loading…</p>;

  const project = projects.find((p) => p.id === id);
  if (!project) {
    return (
      <div className="card empty">
        <h2>Project not found</h2>
        <p className="muted">It may have been deleted, or it was saved in a different browser.</p>
        <Link className="btn" href="/">
          Back to projects
        </Link>
      </div>
    );
  }
  // Keyed so per-project state (tab, what-if baseline) resets when switching projects.
  return <ProjectView key={project.id} project={project} />;
}

function ProjectView({ project }: { project: Project }) {
  const router = useRouter();
  const [view, setView] = useState<View>("tasks");
  const result = useMemo(() => schedule(project), [project]);
  const scheduled = useMemo(() => (result.ok ? new Map(result.tasks.map((t) => [t.id, t])) : null), [result]);

  // Finish day when the page opened, so the summary can show what-if changes (+2d / −1d).
  const [baselineFinish, setBaselineFinish] = useState<number | null>(null);
  useEffect(() => {
    if (baselineFinish === null && result.ok && project.tasks.length > 0) setBaselineFinish(result.finish);
  }, [baselineFinish, result, project.tasks.length]);

  const update = (change: (p: Project) => Project) => updateProject(project.id, change);
  const setTasks = (change: (tasks: Task[]) => Task[]) => update((p) => ({ ...p, tasks: change(p.tasks) }));

  function focusAddTask() {
    setView("tasks");
    // Wait for the tasks tab to render before focusing.
    requestAnimationFrame(() => document.getElementById(ADD_TASK_INPUT)?.focus());
  }

  function remove() {
    if (window.confirm(`Delete "${project.name}" and all its tasks? This can't be undone.`)) {
      deleteProject(project.id);
      router.push("/");
    }
  }

  const hasTasks = project.tasks.length > 0;

  return (
    <div>
      <Link href="/" className="back no-print">
        ← All projects
      </Link>

      <div className="project-head">
        <div className="title-wrap">
          <label htmlFor="project-title" className="sr-only">
            Project name
          </label>
          <input
            id="project-title"
            className="input input-title"
            value={project.name}
            onChange={(e) => update((p) => ({ ...p, name: e.target.value }))}
            onBlur={(e) => {
              if (!e.target.value.trim()) update((p) => ({ ...p, name: "Untitled project" }));
            }}
          />
          {result.ok && hasTasks && (
            <div className="muted small">
              Finishes <strong style={{ color: "var(--text)" }}>{formatDate(endDateOf(project.startDate, result.finish))}</strong>{" "}
              · day {result.finish}
            </div>
          )}
        </div>
        <div className="field no-print" style={{ width: 170 }}>
          <label htmlFor="project-start">Start date (day 0)</label>
          <input
            id="project-start"
            type="date"
            className="input"
            value={project.startDate}
            onChange={(e) => {
              if (isIsoDate(e.target.value)) update((p) => ({ ...p, startDate: e.target.value }));
            }}
          />
        </div>
        <div className="row no-print">
          <button className="btn" onClick={() => window.print()} disabled={!hasTasks}>
            Print / PDF
          </button>
          <button className="btn btn-ghost btn-danger" onClick={remove}>
            Delete project
          </button>
        </div>
      </div>

      <div className="layout">
        <section className="card">
          <div className="tabs" role="tablist">
            {(["tasks", "timeline"] as const).map((v) => (
              <button
                key={v}
                role="tab"
                className="tab"
                aria-selected={view === v}
                aria-controls={`panel-${v}`}
                onClick={() => setView(v)}
              >
                {v === "tasks" ? `Tasks (${project.tasks.length})` : "Timeline"}
              </button>
            ))}
          </div>

          {view === "tasks" ? (
            <div id="panel-tasks" role="tabpanel" className="stack">
              {hasTasks ? (
                <TaskTable
                  tasks={project.tasks}
                  scheduled={scheduled}
                  startDate={project.startDate}
                  onSave={(task) => setTasks((ts) => upsertTask(ts, task))}
                  onDelete={(taskId) => setTasks((ts) => removeTask(ts, taskId))}
                  onDuration={(taskId, d) => setTasks((ts) => setDuration(ts, taskId, d))}
                  onDone={(taskId, done) => setTasks((ts) => setDone(ts, taskId, done))}
                />
              ) : (
                <EmptyState onAdd={focusAddTask} />
              )}
              <div className="no-print" style={{ borderTop: hasTasks ? "1px solid var(--border)" : 0, paddingTop: hasTasks ? 16 : 0 }}>
                <h2 style={{ fontSize: 15 }}>Add a task</h2>
                <TaskForm
                  tasks={project.tasks}
                  nameInputId={ADD_TASK_INPUT}
                  onSave={(task) => setTasks((ts) => upsertTask(ts, task))}
                />
              </div>
            </div>
          ) : (
            <div id="panel-timeline" role="tabpanel">
              {!hasTasks ? (
                <EmptyState onAdd={focusAddTask} />
              ) : result.ok ? (
                <Gantt tasks={result.tasks} finish={result.finish} startDate={project.startDate} />
              ) : (
                <div className="alert alert-error">{result.warnings.join(" ")} Fix it in the Tasks tab to see the timeline.</div>
              )}
            </div>
          )}
        </section>

        <aside>
          <SummaryPanel
            result={result}
            startDate={project.startDate}
            taskCount={project.tasks.length}
            baselineFinish={baselineFinish}
          />
        </aside>
      </div>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="empty">
      <h2>No tasks yet</h2>
      <p className="muted">Add each task with how many days it takes and what it waits for.</p>
      <button className="btn btn-primary" onClick={onAdd}>
        Add your first task
      </button>
    </div>
  );
}
