"use client";

import { useEffect, useRef, useState } from "react";
import { criticalChange, criticalIds } from "@/lib/criticalChange";
import type { ScheduledTask } from "@/lib/scheduler";

/**
 * "Backend API is now critical." After a what-if change or an edit moves the critical path, a
 * small note says which tasks joined it and which left it. It fades after a few seconds and is
 * announced to screen readers. It stays quiet on the first view and for changes that do not move
 * the path, so it only ever says something worth knowing.
 */
export function CriticalNote({ tasks }: { tasks: ScheduledTask[] | null }) {
  const previous = useRef<Set<string> | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!tasks) return; // a plan with a loop has no critical path to compare
    const change = criticalChange(previous.current, tasks);
    previous.current = criticalIds(tasks);
    if (!change.message) return;
    setMessage(change.message);
    const timer = setTimeout(() => setMessage(null), 7000);
    return () => clearTimeout(timer);
  }, [tasks]);

  return (
    <div role="status" className="print:hidden">
      {message && (
        <p className="fp-enter mb-4 inline-flex items-center gap-2.5 rounded-full border border-primary/50 bg-amber-soft px-3.5 py-2 text-sm font-semibold text-amber-text">
          <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
          {message}
        </p>
      )}
    </div>
  );
}
