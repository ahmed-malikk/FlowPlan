"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useNewProject } from "@/components/NewProjectProvider";
import { ProjectCard } from "@/components/ProjectCard";
import { RouteIllustration } from "@/components/RouteIllustration";
import { Button } from "@/components/ui/button";
import { exampleProject } from "@/lib/plan";
import { addProject } from "@/lib/storage";
import { useProjects } from "@/lib/useProjects";

export default function ProjectsPage() {
  const projects = useProjects();
  const router = useRouter();
  const newProject = useNewProject();

  function openExample() {
    const p = exampleProject();
    addProject(p);
    router.push(`/project/${p.id}`);
  }

  return (
    <section className="py-6 min-[521px]:py-8">
      <div className="fp-enter">
        <h1 className="text-[clamp(30px,4.4vw,46px)] leading-[1.05] font-semibold tracking-tight">Your plans</h1>
        <p className="mt-2.5 max-w-[56ch] text-muted-foreground">
          Saved in this browser. Open a plan to see its critical path.
        </p>
      </div>

      {projects === null ? (
        <p className="mt-8 text-muted-foreground">Loading…</p>
      ) : projects.length === 0 ? (
        <div className="fp-enter mx-auto grid max-w-[520px] justify-items-center gap-2.5 px-3 pt-9 pb-6 text-center">
          <RouteIllustration className="h-auto w-[min(360px,100%)]" />
          <h2 className="text-2xl font-bold tracking-tight">No plans yet</h2>
          <p className="text-muted-foreground">
            A plan shows which tasks can slip and which cannot. Start from an example and make it yours, or begin with a
            blank plan.
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-2.5">
            <Button onClick={openExample}>Add the example project</Button>
            <Button variant="outline" onClick={newProject.open}>
              Create your first plan
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(270px,1fr))]">
            {projects.map((p, i) => (
              <ProjectCard key={p.id} project={p} index={i} />
            ))}
            <button
              type="button"
              onClick={newProject.open}
              className="fp-enter grid min-h-[170px] place-items-center rounded-[18px] border border-dashed border-line-strong text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
            >
              <span className="flex items-center gap-2 font-semibold">
                <Plus className="size-5" aria-hidden="true" /> New plan
              </span>
            </button>
          </div>
      )}
    </section>
  );
}
