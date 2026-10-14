"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Gantt } from "@/components/Gantt";
import { PlanHeader } from "@/components/PlanHeader";
import { QuickAdd } from "@/components/QuickAdd";
import { TaskTable } from "@/components/TaskTable";
import { Button } from "@/components/ui/button";
import { ViewSwitch, type View } from "@/components/ViewSwitch";
import { removeTask, setDone, setDuration, upsertTask } from "@/lib/plan";
import { rememberPlan } from "@/lib/nav";
import { schedule, type Project, type Task } from "@/lib/scheduler";
import { statusLine } from "@/lib/status";
import { addProject, deleteProject, updateProject } from "@/lib/storage";
import { useProjects } from "@/lib/useProjects";
import { cn } from "@/lib/utils";

const CARD =
  "rounded-2xl border border-border bg-card p-[18px] shadow-[0_16px_36px_-18px_rgba(0,0,0,0.7)] min-[901px]:max-h-[min(720px,80vh)] min-[901px]:overflow-auto";

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const projects = useProjects();

  if (projects === null) return <p className="py-8 text-muted-foreground">Loading…</p>;

  const project = projects.find((p) => p.id === id);
  if (!project) {
    return (
      <section className="mx-auto grid max-w-[520px] justify-items-center gap-2.5 px-3 py-16 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Project not found</h1>
        <p className="text-muted-foreground">It may have been deleted, or it was saved in a different browser.</p>
        <Button asChild className="mt-2">
          <Link href="/">Back to projects</Link>
        </Button>
      </section>
    );
  }
  // Keyed so per-project state resets when switching projects.
  return <ProjectView key={project.id} project={project} />;
}

function ProjectView({ project }: { project: Project }) {
  const router = useRouter();
  // The phone tab bar offers a shortcut back to the plan you had open.
  useEffect(() => rememberPlan(project.id), [project.id]);

  const [view, setView] = useState<View>("tasks");
  const result = useMemo(() => schedule(project), [project]);
  const scheduled = useMemo(() => (result.ok ? new Map(result.tasks.map((t) => [t.id, t])) : null), [result]);
  const status = statusLine(project.startDate, project.tasks, result);
  const hasTasks = project.tasks.length > 0;
  const complete = hasTasks && project.tasks.every((t) => t.done);

  const update = (change: (p: Project) => Project) => updateProject(project.id, change);
  const setTasks = (change: (tasks: Task[]) => Task[]) => update((p) => ({ ...p, tasks: change(p.tasks) }));

  function remove() {
    const snapshot = project;
    deleteProject(project.id);
    router.push("/");
    toast(`Deleted "${snapshot.name}"`, {
      action: {
        label: "Undo",
        onClick: () => {
          addProject(snapshot);
          router.push(`/project/${snapshot.id}`);
        },
      },
    });
  }

  return (
    <div className="py-6 min-[521px]:py-8">
      <PlanHeader
        name={project.name}
        startDate={project.startDate}
        status={status}
        complete={complete}
        canPrint={hasTasks}
        onRename={(name) => update((p) => ({ ...p, name }))}
        onStartDate={(startDate) => update((p) => ({ ...p, startDate }))}
        onPrint={() => window.print()}
        onDelete={remove}
      />

      <QuickAdd tasks={project.tasks} onSave={(task) => setTasks((ts) => upsertTask(ts, task))} />

      <ViewSwitch view={view} onChange={setView} />

      {/* Two cards of equal height side by side; on a phone one at a time, Tasks first. */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-[18px] min-[901px]:grid-cols-[minmax(320px,380px)_minmax(0,1fr)]">
        <section id="tasks-card" aria-label="Tasks" className={cn(CARD, view === "diagram" && "max-[900px]:hidden")}>
          <h2 className="mb-1.5 text-[17px] font-bold tracking-tight">Tasks</h2>
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
            <p className="mt-3 text-muted-foreground">Tasks you add appear here with what they wait for and how much slack they have.</p>
          )}
        </section>

        <section id="flow-card" aria-label="Timeline" className={cn(CARD, view === "tasks" && "max-[900px]:hidden")}>
          {!hasTasks ? (
            <p className="text-muted-foreground">Add a task and the plan draws itself here.</p>
          ) : result.ok ? (
            <Gantt tasks={result.tasks} finish={result.finish} startDate={project.startDate} />
          ) : (
            <p role="alert" className="font-semibold text-destructive">
              {result.warnings.join(" ")}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
