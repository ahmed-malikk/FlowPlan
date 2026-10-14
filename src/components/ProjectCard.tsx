"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { toast } from "sonner";
import { MiniRoute } from "@/components/MiniRoute";
import { endDateOf, formatShortDate } from "@/lib/plan";
import { schedule, type Project } from "@/lib/scheduler";
import { addProject, deleteProject } from "@/lib/storage";
import { navigateWithRouteTransition } from "@/lib/viewTransition";

/**
 * One plan: its route, its name and when it finishes. The whole card opens the plan;
 * delete is a separate button and shows an Undo toast instead of a confirm dialog.
 */
export function ProjectCard({ project, index }: { project: Project; index: number }) {
  const router = useRouter();
  const routeRef = useRef<SVGSVGElement>(null);
  const result = schedule(project);
  const href = `/project/${project.id}`;

  function open(e: React.MouseEvent<HTMLAnchorElement>) {
    // Let the browser handle new-tab and modified clicks.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    navigateWithRouteTransition(routeRef.current, () => router.push(href));
  }

  function remove() {
    deleteProject(project.id);
    toast(`Deleted "${project.name}"`, { action: { label: "Undo", onClick: () => addProject(project) } });
  }

  return (
    <article
      className="fp-enter group relative rounded-[18px] border border-border bg-card p-4 shadow-[0_16px_36px_-18px_rgba(0,0,0,0.7)] transition-[translate,border-color] duration-300 ease-(--ease-out-soft) hover:-translate-y-1 hover:border-primary motion-reduce:hover:translate-y-0"
      style={{ animationDelay: `${Math.min(index, 8) * 0.06}s` }}
    >
      <MiniRoute ref={routeRef} tasks={result.ok ? result.tasks : []} className="mb-2.5 block h-24 w-full" />
      <h2 className="pr-10 text-[17px] font-bold tracking-tight">
        {/* The link's ::after stretches over the whole card, so any click on the card opens the plan. */}
        <Link href={href} onClick={open} className="rounded-md text-foreground after:absolute after:inset-0 after:rounded-[18px]">
          {project.name}
        </Link>
      </h2>
      {result.ok ? (
        <p className="mt-0.5 text-sm text-muted-foreground">
          {project.tasks.length} {project.tasks.length === 1 ? "task" : "tasks"}
          {result.finish > 0 && <>, finishes {formatShortDate(endDateOf(project.startDate, result.finish))}</>}
        </p>
      ) : (
        <p className="mt-0.5 text-sm font-semibold text-destructive">Has a circular dependency</p>
      )}
      <button
        type="button"
        onClick={remove}
        aria-label={`Delete ${project.name}`}
        className="absolute top-3 right-3 z-10 grid size-11 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive md:size-9"
      >
        <Trash2 className="size-[18px]" aria-hidden="true" />
      </button>
    </article>
  );
}
