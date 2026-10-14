"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import type { View } from "@/components/ViewSwitch";

type Step = { target: string; view: View; title: string; body: string };

const STEPS: Step[] = [
  {
    target: "#quick-add",
    view: "tasks",
    title: "Add a task",
    body: "Type what needs doing, how many days it takes and what it waits for. FlowPlan works out the rest.",
  },
  {
    target: "#tasks-card li",
    view: "tasks",
    title: "Try what-if",
    body: "Press + or − on a task. The diagram and the finish date update at once.",
  },
  {
    target: "#critical-strip",
    view: "diagram",
    title: "Follow the amber path",
    body: "Tasks on the amber path decide your finish date. Everything else has slack.",
  },
];

const PAD = 8;

/**
 * A three-step tour for a first visit: it dims the page, lights one part, and says what it is for.
 * Skippable at any step (Skip, Escape), shown once, and a step is skipped if its part is not on the
 * page. On a phone it switches between Tasks and Diagram so each step is visible.
 */
export function Tour({ open, onClose, setView }: { open: boolean; onClose: () => void; setView: (v: View) => void }) {
  const [index, setIndex] = useState(0);
  const [spot, setSpot] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);

  const finish = useCallback(() => {
    setIndex(0);
    setSpot(null);
    setView("tasks");
    onClose();
  }, [onClose, setView]);

  // Light the current step's target. Steps whose target is missing are passed over.
  useLayoutEffect(() => {
    if (!open) return;
    const step = STEPS[index];
    setView(step.view);
    let frame = 0;
    const place = () => {
      const el = document.querySelector<HTMLElement>(step.target);
      if (!el || el.offsetParent === null) {
        if (index >= STEPS.length - 1) finish();
        else setIndex(index + 1);
        return;
      }
      el.scrollIntoView({ block: "center", behavior: "auto" });
      const r = el.getBoundingClientRect();
      setSpot({ top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 });
    };
    // Wait two frames so a view switch has rendered before measuring.
    frame = requestAnimationFrame(() => (frame = requestAnimationFrame(place)));
    const onResize = () => place();
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    };
  }, [open, index, setView, finish]);

  useEffect(() => {
    if (open && spot) nextRef.current?.focus();
  }, [open, index, spot]);

  if (!open || !spot) return null;
  const step = STEPS[index];
  const last = index === STEPS.length - 1;
  const popWidth = Math.min(330, window.innerWidth - 32);
  const below = window.innerHeight - (spot.top + spot.height) > 210;
  const left = Math.max(16, Math.min(window.innerWidth - popWidth - 16, spot.left));
  const top = below ? spot.top + spot.height + 12 : Math.max(16, spot.top - 12 - 190);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-title"
      className="fixed inset-0 z-80"
      onKeyDown={(e) => {
        if (e.key === "Escape") finish();
        if (e.key === "Tab") {
          // Keep the keyboard inside the tour: it has two buttons.
          e.preventDefault();
          (document.activeElement === nextRef.current ? skipRef : nextRef).current?.focus();
        }
      }}
    >
      <div
        className="pointer-events-none fixed rounded-2xl outline-2 outline-primary transition-all duration-[450ms] ease-(--ease-out-soft) [box-shadow:0_0_0_9999px_rgba(1,3,9,0.74)]"
        style={{ top: spot.top, left: spot.left, width: spot.width, height: spot.height }}
      />
      <div
        ref={popRef}
        className="fixed grid gap-1.5 rounded-2xl border border-line-strong bg-popover p-[18px] shadow-[0_18px_40px_-14px_rgba(0,0,0,0.8)]"
        style={{ top, left, width: popWidth }}
      >
        <h2 id="tour-title" className="text-[17px] font-bold tracking-tight">
          {step.title}
        </h2>
        <p className="mb-2.5 text-[14.5px] text-muted-foreground">{step.body}</p>
        <div className="flex items-center gap-2.5">
          <span className="mr-auto text-[13px] text-muted-foreground">
            Step {index + 1} of {STEPS.length}
          </span>
          <Button ref={skipRef} variant="outline" onClick={finish}>
            Skip tour
          </Button>
          <Button ref={nextRef} onClick={() => (last ? finish() : setIndex(index + 1))}>
            {last ? "Done" : "Next"}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
