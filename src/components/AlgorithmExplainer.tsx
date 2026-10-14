"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { explainCards, STEP_TEXT, STEP_TITLES, type ExplainStep } from "@/lib/explainer";
import { exampleProject } from "@/lib/plan";
import { schedule } from "@/lib/scheduler";
import { cn } from "@/lib/utils";

const STEPS: ExplainStep[] = [1, 2, 3, 4];

/**
 * The four steps of the critical path method, on the example plan. When it scrolls into view it
 * steps through once by itself (not for visitors who prefer reduced motion); after that, or as soon
 * as a step is chosen, it is manual.
 */
export function AlgorithmExplainer() {
  const tasks = useMemo(() => {
    const result = schedule(exampleProject());
    return result.ok ? result.tasks : [];
  }, []);
  const [step, setStep] = useState<ExplainStep>(1);
  const root = useRef<HTMLDivElement>(null);
  const played = useRef(false);
  const manual = useRef(false);

  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let interval: ReturnType<typeof setInterval> | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || played.current) return;
        played.current = true;
        let next = 1;
        interval = setInterval(() => {
          next += 1;
          if (next > 4 || manual.current) return clearInterval(interval);
          setStep(next as ExplainStep);
        }, 2600);
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  const cards = explainCards(step, tasks);

  return (
    <div ref={root} className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-[0_16px_36px_-18px_rgba(0,0,0,0.7)]">
      <div role="group" aria-label="Steps" className="mb-3.5 flex flex-wrap gap-2">
        {STEPS.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={step === s}
            onClick={() => {
              manual.current = true;
              setStep(s);
            }}
            className={cn(
              "h-11 rounded-full border border-line-strong px-3.5 font-semibold text-muted-foreground transition-colors md:h-10",
              step === s && "border-primary bg-primary text-primary-foreground",
            )}
          >
            {s} {STEP_TITLES[s]}
          </button>
        ))}
      </div>

      <div key={step} className="grid gap-2.5 [grid-template-columns:repeat(auto-fill,minmax(150px,1fr))]">
        {cards.map((c, i) => (
          <div
            key={c.id}
            className={cn(
              "fp-node-in min-h-[74px] rounded-xl border bg-surface-2 px-3 py-2.5",
              c.critical ? "border-primary shadow-[0_0_0_3px_var(--amber-soft)]" : "border-line-strong",
            )}
            style={{ "--lv": i * 0.45 } as React.CSSProperties}
          >
            <b className="block text-sm">{c.name}</b>
            <span className="mt-1 block font-mono text-xs text-muted-foreground">{c.lines[0]}</span>
            <span className="block font-mono text-xs text-muted-foreground">{c.lines[1]}</span>
          </div>
        ))}
      </div>

      <p aria-live="polite" className="mt-3.5 min-h-[3em] text-[14.5px] text-muted-foreground">
        {STEP_TEXT[step]}
      </p>
    </div>
  );
}
