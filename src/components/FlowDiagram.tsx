"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { flowStructure, related } from "@/lib/flowLayout";
import { flowGeometry, NODE_H } from "@/lib/flowGeometry";
import type { ScheduledTask } from "@/lib/scheduler";
import { useElementSize } from "@/lib/useElementSize";
import { cn } from "@/lib/utils";

type Props = {
  tasks: ScheduledTask[]; // in topological order, as schedule() returns them
  finish: number; // project length in days: the scale of the little duration bars
  highlightId: string | null; // the task pointed at, here or in the list
  ripple: { id: string; tick: number } | null; // a what-if change: pulse everything that waits for it
  lastAddedId: string | null;
  onHighlight: (id: string | null) => void;
  onEdit: (id: string, opener: HTMLElement) => void;
};

// A browser does not re-run measuring code on the printed page, so the diagram is drawn for a
// fixed board that fills the printed card (A4 landscape, full width) from the moment printing starts.
const PRINT_SIZE = { width: 1040, height: 400 };

// The draw-in plays once per visit, not every time a plan is opened.
let introPlayed = false;

/**
 * The plan as a route: each task is a station, arrows join the tasks that wait for each other,
 * the critical path is amber. Wide boards run left to right, narrow ones top to bottom.
 * Nodes are real buttons, so Tab, Enter and Space work and a screen reader hears dates and status.
 */
export function FlowDiagram({ tasks, finish, highlightId, ripple, lastAddedId, onHighlight, onEdit }: Props) {
  const boardRef = useRef<HTMLDivElement>(null);
  const measured = useElementSize(boardRef);
  const [printing, setPrinting] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("print");
    const on = () => flushSync(() => setPrinting(true));
    const off = () => setPrinting(false);
    const change = () => (media.matches ? on() : off());
    window.addEventListener("beforeprint", on);
    window.addEventListener("afterprint", off);
    media.addEventListener("change", change);
    return () => {
      window.removeEventListener("beforeprint", on);
      window.removeEventListener("afterprint", off);
      media.removeEventListener("change", change);
    };
  }, []);
  const size = printing ? PRINT_SIZE : measured;
  const flow = useMemo(() => flowStructure(tasks), [tasks]);
  const geo = useMemo(() => (size.width > 0 ? flowGeometry(flow, size) : null), [flow, size]);
  const [intro] = useState(() => !introPlayed);
  useEffect(() => {
    introPlayed = true;
  }, []);

  // What lights up while a task is pointed at: itself, what it waits for, what waits for it.
  const lit = useMemo(() => {
    if (!highlightId || !flow.nodes.some((n) => n.id === highlightId)) return null;
    const r = related(flow, highlightId);
    return new Set([highlightId, ...r.ancestors, ...r.descendants.keys()]);
  }, [flow, highlightId]);

  // A what-if change sends a pulse down the tasks that wait for the changed one.
  const [pulses, setPulses] = useState<Map<string, number>>(new Map());
  const lastTick = useRef(0);
  useEffect(() => {
    if (!ripple || ripple.tick === lastTick.current) return;
    lastTick.current = ripple.tick;
    setPulses(related(flow, ripple.id).descendants);
    const timer = setTimeout(() => setPulses(new Map()), 1600);
    return () => clearTimeout(timer);
  }, [ripple, flow]);

  const scale = Math.max(12, finish + 1);
  const byId = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);

  return (
    <div
      ref={boardRef}
      data-flow-board
      role="region"
      aria-label="Flow diagram, scrollable"
      tabIndex={0}
      onMouseLeave={() => onHighlight(null)}
      className={cn(
        "relative min-h-[300px] flex-1 overflow-auto print:h-[400px] print:flex-none print:overflow-hidden bg-[radial-gradient(circle_at_1px_1px,rgba(77,105,182,0.4)_1px,transparent_0)] [background-size:22px_22px]",
        geo?.vertical && "flex-none overflow-visible",
      )}
      style={geo?.vertical ? { height: geo.height } : undefined}
    >
      {/* A soft amber glow behind the middle of the route. */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-3/5 w-[70%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(closest-side,rgba(224,136,62,0.1),transparent)]" />

      {geo && (
        <>
          <svg width={geo.width} height={geo.height} className="absolute top-0 left-0" aria-hidden="true">
            <defs>
              <marker id="fp-arrow-amber" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                <path d="M0 1L9 5L0 9z" fill="var(--primary)" />
              </marker>
              <marker id="fp-arrow-blue" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                <path d="M0 1L9 5L0 9z" fill="var(--edge)" />
              </marker>
            </defs>
            {geo.edges.map((e) => {
              const dim = lit !== null && !(lit.has(e.from) && lit.has(e.to));
              return (
                <g key={`${e.from}-${e.to}`}>
                  <path
                    d={e.d}
                    pathLength={1}
                    fill="none"
                    strokeWidth={3}
                    strokeLinecap="round"
                    stroke={e.critical ? "var(--primary)" : "var(--edge)"}
                    markerEnd={e.critical ? "url(#fp-arrow-amber)" : "url(#fp-arrow-blue)"}
                    className={cn("transition-[opacity,stroke] duration-300", intro && "fp-edge-in", dim && "opacity-15")}
                    style={{ "--lv": e.level } as React.CSSProperties}
                  />
                  {e.critical && (
                    <circle r="4" fill="var(--amber-text)" className="motion-reduce:hidden" aria-hidden="true">
                      <animateMotion dur="2.4s" begin={`${(e.level * 0.5).toFixed(1)}s`} repeatCount="4" path={e.d} />
                      {/* After its four loops the dot disappears instead of snapping back to the corner. */}
                      <set attributeName="opacity" to="0" begin={`${(e.level * 0.5 + 9.6).toFixed(1)}s`} fill="freeze" />
                    </circle>
                  )}
                </g>
              );
            })}
          </svg>

          {flow.nodes.map((n) => {
            const t = byId.get(n.id)!;
            const box = geo.nodes[n.id];
            const dim = lit !== null && !lit.has(n.id);
            const pulse = pulses.get(n.id);
            return (
              <button
                key={n.id}
                type="button"
                onClick={(e) => onEdit(n.id, e.currentTarget)}
                onPointerEnter={(e) => e.pointerType === "mouse" && onHighlight(n.id)}
                onFocus={(e) => e.currentTarget.matches(":focus-visible") && onHighlight(n.id)}
                onBlur={() => onHighlight(null)}
                title={t.name}
                aria-label={`${t.name}, day ${t.es} to ${t.ef}, ${t.critical ? "critical" : `${t.slack} days slack`}${t.done ? ", done" : ""}. Edit`}
                className={cn(
                  "absolute overflow-hidden rounded-[14px] border bg-surface-2 px-3 pt-[9px] text-left transition-[border-color,box-shadow,opacity,translate] duration-300 ease-(--ease-out-soft) hover:-translate-y-[3px] motion-reduce:hover:translate-y-0",
                  t.critical ? "border-primary shadow-[0_0_0_3px_var(--amber-soft)]" : "border-line-strong",
                  t.done && "opacity-80",
                  dim && "opacity-30",
                  intro && "fp-node-in",
                  !intro && n.id === lastAddedId && "fp-pop",
                  pulse !== undefined && "fp-ripple",
                )}
                style={{ left: box.x, top: box.y, width: box.w, height: NODE_H, "--lv": n.level, "--d": pulse ?? 0 } as React.CSSProperties}
              >
                <span className="block truncate pr-[18px] text-sm font-bold">{t.name}</span>
                <span className="block font-mono text-xs text-muted-foreground">
                  day {t.es} to {t.ef}
                </span>
                {/* The task's own bar on the plan's timeline: when it runs, and how far it can slip. */}
                <span className="absolute right-3 bottom-[9px] left-3 h-[5px] rounded-full bg-g0/50">
                  <span
                    className={cn("absolute inset-y-0 rounded-full transition-[left,width] duration-500 ease-(--ease-out-soft)", t.critical ? "bg-primary" : "bg-slack")}
                    style={{ left: `${(t.es / scale) * 100}%`, width: `${(t.duration / scale) * 100}%` }}
                  />
                  {t.slack > 0 && (
                    <span
                      className="absolute inset-y-0 rounded-full border border-dashed border-slack transition-[left,width] duration-500 ease-(--ease-out-soft)"
                      style={{ left: `${(t.ef / scale) * 100}%`, width: `${(t.slack / scale) * 100}%` }}
                    />
                  )}
                </span>
                <svg
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                  className={cn("absolute top-2 right-2 size-4 transition-transform duration-400 ease-(--ease-out-soft)", t.done ? "scale-100" : "scale-0")}
                >
                  <circle cx="8" cy="8" r="8" fill="var(--done)" />
                  <path d="M4.5 8.2l2.4 2.4 4.6-5" stroke="#04281d" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            );
          })}
        </>
      )}
    </div>
  );
}
