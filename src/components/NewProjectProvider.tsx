"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isIsoDate, newId, todayIso } from "@/lib/plan";
import type { Project } from "@/lib/scheduler";
import { addProject } from "@/lib/storage";

const NewProjectContext = createContext<{ open: () => void }>({ open: () => {} });

/** Anything on any page can open the New project dialog, for example the header button. */
export function useNewProject() {
  return useContext(NewProjectContext);
}

export function NewProjectProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  // Radix only restores focus to a Trigger; ours opens from anywhere, so remember who opened it.
  const opener = useRef<HTMLElement | null>(null);
  const open = useCallback(() => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setIsOpen(true);
  }, []);
  const value = useMemo(() => ({ open }), [open]);

  return (
    <NewProjectContext.Provider value={value}>
      {children}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            opener.current?.focus();
          }}
        >
          {/* Remounting on each open resets the form without an effect. */}
          {isOpen && <NewProjectForm onDone={() => setIsOpen(false)} />}
        </DialogContent>
      </Dialog>
    </NewProjectContext.Provider>
  );
}

function NewProjectForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(todayIso);
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("Give the project a name.");
    if (!isIsoDate(startDate)) return setError("Pick a start date.");
    const project: Project = { id: newId(), name: name.trim(), startDate, tasks: [] };
    addProject(project);
    onDone();
    router.push(`/project/${project.id}`);
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      <div>
        <DialogTitle>New project</DialogTitle>
        <DialogDescription className="mt-1">Name it, pick the day it starts, then add tasks.</DialogDescription>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="project-name">Name</Label>
        <Input
          id="project-name"
          placeholder="e.g. Client website, FYP, Portfolio sprint"
          value={name}
          aria-invalid={!!error && !name.trim()}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="project-start">Start date (day 0)</Label>
        <Input
          id="project-start"
          type="date"
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value);
            setError(null);
          }}
        />
      </div>
      {error && (
        <p role="alert" className="text-sm font-semibold text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full">
        Create project
      </Button>
    </form>
  );
}
