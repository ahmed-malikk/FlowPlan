"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { EmptyPlan } from "@/components/EmptyPlan";
import { CriticalNote } from "@/components/CriticalNote";
import { CriticalStrip } from "@/components/CriticalStrip";
import { FlowDiagram } from "@/components/FlowDiagram";
import { PlanHeader } from "@/components/PlanHeader";
import { PrintTimeline } from "@/components/PrintTimeline";
import { QUICK_ADD_INPUT, QuickAdd } from "@/components/QuickAdd";
import { EditSheet } from "@/components/EditSheet";
import { TasksList } from "@/components/TasksList";
import { Button } from "@/components/ui/button";
import { Tour } from "@/components/Tour";
import { ViewSwitch, type View } from "@/components/ViewSwitch";
import { exampleProject, removeTask, setDone, setDuration, upsertTask } from "@/lib/plan";
import { rememberPlan } from "@/lib/nav";
import { hasSeen, markSeen } from "@/lib/seen";
import { schedule, type Project, type Task } from "@/lib/scheduler";
import { statusLine } from "@/lib/status";
import { addProject, deleteProject, updateProject } from "@/lib/storage";
import { useProjects } from "@/lib/useProjects";
import { cn } from "@/lib/utils";

const CARD =
  "rounded-2xl border border-border bg-card shadow-[0_16px_36px_-18px_rgba(0,0,0,0.7)] min-[901px]:max-h-[min(720px,80vh)]";

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
  // A tab, a bookmark and a screen reader should say which plan this is.
  useEffect(() => {
    const before = document.title;
    document.title = `${project.name || "Untitled project"} · FlowPlan`;
    return () => {
      document.title = before;
    };
  }, [project.name]);

  const [view, setView] = useState<View>("tasks");
  const [tourOpen, setTourOpen] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null); // the task pointed at, in the list or the diagram
  const [ripple, setRipple] = useState<{ id: string; tick: number } | null>(null); // a what-if change to pulse
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editOpener = useRef<HTMLElement | null>(null); // gets focus back when the edit dialog closes
  const result = useMemo(() => schedule(project), [project]);
  const scheduled = useMemo(() => (result.ok ? new Map(result.tasks.map((t) => [t.id, t])) : null), [result]);
  const status = statusLine(project.startDate, project.tasks, result);
  const hasTasks = project.tasks.length > 0;
  const complete = hasTasks && project.tasks.every((t) => t.done);

  // Plan complete: say so once when the last task is ticked. Un-ticking one re-arms it.
  const wasComplete = useRef(complete);
  useEffect(() => {
    if (complete && !wasComplete.current) toast("Plan complete. Every task is done.");
    wasComplete.current = complete;
  }, [complete]);

  const update = (change: (p: Project) => Project) => updateProject(project.id, change);
  const setTasks = (change: (tasks: Task[]) => Task[]) => update((p) => ({ ...p, tasks: change(p.tasks) }));

  // First visit to a plan that has tasks: offer the tour once, after the page has settled.
  useEffect(() => {
    if (project.tasks.length === 0 || hasSeen("tour")) return;
    const timer = setTimeout(() => {
      // Never take the keyboard away from someone who has already started typing.
      const typing = document.activeElement instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
      if (!typing) setTourOpen(true);
    }, 1800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on arrival, not whenever tasks change
  }, []);

  const startWithExample = () => setTasks(() => exampleProject().tasks);
  const focusQuickAdd = () => document.getElementById(QUICK_ADD_INPUT)?.focus();

  /** Deleting a task is never final: the toast offers Undo and restores the whole task list. */
  function removeTaskWithUndo(taskId: string) {
    const before = project.tasks;
    const name = before.find((t) => t.id === taskId)?.name ?? "task";
    setEditingId(null);
    setTasks((ts) => removeTask(ts, taskId));
    toast(`Deleted "${name}"`, { action: { label: "Undo", onClick: () => setTasks(() => before) } });
  }

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
      {hasTasks && (
        <div className="max-[900px]:hidden">
          {[
            ["#tasks-card", "Skip to tasks"],
            ["#flow-card", "Skip to diagram"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-90 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:font-semibold focus:text-primary-foreground"
            >
              {label}
            </a>
          ))}
        </div>
      )}
      <PlanHeader
        name={project.name}
        startDate={project.startDate}
        status={status}
        complete={complete}
        canPrint={hasTasks}
        onRename={(name) => update((p) => ({ ...p, name }))}
        onStartDate={(startDate) => update((p) => ({ ...p, startDate }))}
        onPrint={() => window.print()}
        onTour={() => setTourOpen(true)}
        onDelete={remove}
      />

      <CriticalNote tasks={result.ok ? result.tasks : null} />

      <QuickAdd
        tasks={project.tasks}
        onSave={(task) => {
          setLastAddedId(task.id);
          setTasks((ts) => upsertTask(ts, task));
        }}
      />

      <ViewSwitch view={view} onChange={setView} />

      {/* Two cards of equal height side by side; on a phone one at a time, Tasks first. */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-[18px] min-[901px]:grid-cols-[minmax(320px,380px)_minmax(0,1fr)]">
        <section id="tasks-card" aria-label="Tasks" className={cn(CARD, "p-[18px] min-[901px]:overflow-auto print:max-h-none print:overflow-visible print:border-0 print:p-0", view === "diagram" && "max-[900px]:hidden print:block")}>
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <h2 className="text-[17px] font-bold tracking-tight">Tasks</h2>
            {/* Phones and tablets show one card at a time, so the way to the diagram is one tap. */}
            <button
              type="button"
              onClick={() => {
                setView("diagram");
                requestAnimationFrame(() => document.getElementById("flow-card")?.scrollIntoView({ behavior: "smooth", block: "start" }));
              }}
              className="min-h-11 rounded-md px-1 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground min-[901px]:hidden print:hidden"
            >
              Jump to diagram
            </button>
          </div>
          {hasTasks ? (
            <TasksList
              tasks={project.tasks}
              scheduled={scheduled}
              startDate={project.startDate}
              onDuration={(taskId, d) => {
                setRipple((r) => ({ id: taskId, tick: (r?.tick ?? 0) + 1 }));
                setTasks((ts) => setDuration(ts, taskId, d));
              }}
              onHighlight={setHighlightId}
              onDone={(taskId, done) => setTasks((ts) => setDone(ts, taskId, done))}
              onEdit={(id, opener) => {
                editOpener.current = opener;
                setEditingId(id);
              }}
              onDelete={removeTaskWithUndo}
            />
          ) : (
            <>
              <p className="mt-3 text-muted-foreground max-[900px]:hidden">
                Tasks you add appear here with what they wait for and how much slack they have.
              </p>
              {/* On a phone the Tasks card is the first thing a blank plan shows, so the empty state lives here too. */}
              <div className="flex min-[901px]:hidden">
                <EmptyPlan onExample={startWithExample} onFirstTask={focusQuickAdd} />
              </div>
            </>
          )}
        </section>

        <section
          id="flow-card"
          aria-label="Flow diagram"
          className={cn(CARD, "flex flex-col overflow-hidden print:hidden", view === "tasks" && "max-[900px]:hidden")}
        >
          {!hasTasks ? (
            <EmptyPlan onExample={startWithExample} onFirstTask={focusQuickAdd} />
          ) : result.ok ? (
            <>
            <FlowDiagram
              tasks={result.tasks}
              finish={result.finish}
              highlightId={highlightId}
              ripple={ripple}
              lastAddedId={lastAddedId}
              onHighlight={setHighlightId}
              onEdit={(id, opener) => {
                editOpener.current = opener;
                setEditingId(id);
              }}
            />
            <CriticalStrip tasks={result.tasks} startDate={project.startDate} />
            </>
          ) : (
            <p role="alert" className="p-[18px] font-semibold text-destructive">
              {result.warnings.join(" ")}
            </p>
          )}
        </section>

        {/* The printed page keeps the timeline: a diagram is for the screen, a timeline is for paper. */}
        {hasTasks && result.ok && (
          <section aria-label="Timeline" className="hidden print:block">
            <PrintTimeline tasks={result.tasks} finish={result.finish} startDate={project.startDate} />
          </section>
        )}
      </div>

      <Tour
        open={tourOpen}
        setView={setView}
        onClose={() => {
          markSeen("tour");
          setTourOpen(false);
        }}
      />

      <EditSheet
        task={project.tasks.find((t) => t.id === editingId) ?? null}
        tasks={project.tasks}
        onClose={() => setEditingId(null)}
        onSave={(task) => setTasks((ts) => upsertTask(ts, task))}
        onDelete={removeTaskWithUndo}
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          editOpener.current?.focus();
        }}
      />
    </div>
  );
}
