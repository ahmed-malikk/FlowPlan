"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { endDateOf, exampleProject, formatDate, isIsoDate, newId, todayIso } from "@/lib/plan";
import { schedule, type Project } from "@/lib/scheduler";
import { addProject, deleteProject } from "@/lib/storage";
import { useProjects } from "@/lib/useProjects";

export default function ProjectsPage() {
  const projects = useProjects();
  const router = useRouter();

  function openExample() {
    const p = exampleProject();
    addProject(p);
    router.push(`/project/${p.id}`);
  }

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Projects</h1>
          <p className="muted" style={{ margin: "4px 0 0" }}>
            Add tasks and what they wait for. FlowPlan finds the finish date, the critical path and how much every
            task can slip.
          </p>
        </div>
      </div>

      <CreateProject onCreated={(id) => router.push(`/project/${id}`)} />

      {projects === null ? (
        <p className="muted">Loading…</p>
      ) : projects.length === 0 ? (
        <div className="card empty">
          <h2>No projects yet</h2>
          <p className="muted">Create one above, or open the 7-task website example to see how it works.</p>
          <button className="btn" onClick={openExample}>
            Open the example project
          </button>
        </div>
      ) : (
        <>
          <div className="project-grid">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
          <div>
            <button className="btn btn-ghost btn-sm" onClick={openExample}>
              + Add the example project
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function CreateProject({ onCreated }: { onCreated: (id: string) => void }) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(todayIso);
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("Give the project a name.");
    if (!isIsoDate(startDate)) return setError("Pick a start date.");
    const project: Project = { id: newId(), name: name.trim(), startDate, tasks: [] };
    addProject(project);
    onCreated(project.id);
  }

  return (
    <form className="card" onSubmit={submit} noValidate>
      <h2>New project</h2>
      <div className="create-form">
        <div className="field">
          <label htmlFor="project-name">Name</label>
          <input
            id="project-name"
            className="input"
            placeholder="e.g. Client website, FYP, Portfolio sprint"
            value={name}
            aria-invalid={!!error && !name.trim()}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
          />
        </div>
        <div className="field">
          <label htmlFor="project-start">Start date (day 0)</label>
          <input
            id="project-start"
            className="input"
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setError(null);
            }}
          />
        </div>
        <button className="btn btn-primary" type="submit">
          Create project
        </button>
      </div>
      {error && (
        <p className="field-error" role="alert" style={{ margin: "8px 0 0" }}>
          {error}
        </p>
      )}
    </form>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const result = schedule(project);
  const critical = result.ok ? result.tasks.filter((t) => t.critical).length : 0;

  function remove() {
    if (window.confirm(`Delete "${project.name}" and all its tasks? This can't be undone.`)) deleteProject(project.id);
  }

  return (
    <article className="card project-card">
      <h3>
        <Link href={`/project/${project.id}`}>{project.name}</Link>
      </h3>
      <div className="project-stats">
        <div>
          <strong className="num">{project.tasks.length}</strong>
          tasks
        </div>
        <div>
          <strong className="num">{result.ok ? `${result.finish}d` : "—"}</strong>
          duration
        </div>
        <div>
          <strong className="num">{critical}</strong>
          critical
        </div>
      </div>
      <div className="small muted">
        {formatDate(project.startDate)}
        {result.ok && result.finish > 0 && <> → {formatDate(endDateOf(project.startDate, result.finish))}</>}
      </div>
      {!result.ok && <div className="alert alert-error small">Has a circular dependency</div>}
      <div className="row">
        <Link className="btn btn-sm" href={`/project/${project.id}`}>
          Open
        </Link>
        <span className="spacer" />
        <button className="btn btn-sm btn-ghost btn-danger" onClick={remove}>
          Delete
        </button>
      </div>
    </article>
  );
}
