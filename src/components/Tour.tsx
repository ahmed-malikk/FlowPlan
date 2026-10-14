"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import type { View } from "@/components/ViewSwitch";

type Step = { target: string; view: View; title: string; body: string };
type Box = { top: number; left: number; width: number; height: number };

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
const FADE_MS = 200;

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

function measure(el: HTMLElement): Box {
  const r = el.getBoundingClientRect();
  return { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 };
}

/**
 * A three-step tour for a first visit: it dims the page, lights one part, and says what it is for.
 * While it is open the page is frozen (wheel, touch and scrollbar) and only its own box can be used:
 * Next, Skip tour or Escape. Moving to the next step is one smooth motion: the box fades out, the
 * light glides (or, when the next part is off screen, shrinks away while the page scrolls there),
 * and the next box fades in. Shown once; a step is skipped if its part is not on the page. On a
 * phone it switches between Tasks and Diagram so each step is visible.
 */
export function Tour({ open, onClose, setView }: { open: boolean; onClose: () => void; setView: (v: View) => void }) {
  const [index, setIndex] = useState(0); // the step we are going to
  const [shown, setShown] = useState(0); // the step whose text is on screen
  const [spot, setSpot] = useState<Box | null>(null); // the light
  const [target, setTarget] = useState<Box | null>(null); // where the box sits
  const [busy, setBusy] = useState(false); // between two steps: box hidden
  const [collapsed, setCollapsed] = useState(false); // light shrunk away while the page scrolls
  const rootRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const settled = useRef<Box | null>(null);

  const finish = useCallback(() => {
    setIndex(0);
    setShown(0);
    setSpot(null);
    setTarget(null);
    setBusy(false);
    setCollapsed(false);
    settled.current = null;
    setView("tasks");
    onClose();
  }, [onClose, setView]);

  // Freeze the page while the tour is open. Closing the scrollbar would shift the layout, so its
  // width is replaced with padding. Scripted scrolling (the tour's own) still works.
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const body = document.body;
    const before = { overflow: html.style.overflow, padding: body.style.paddingRight };
    const bar = window.innerWidth - html.clientWidth;
    html.style.overflow = "hidden";
    if (bar > 0) body.style.paddingRight = `${bar}px`;
    return () => {
      html.style.overflow = before.overflow;
      body.style.paddingRight = before.padding;
    };
  }, [open]);

  // The dimmed page must not scroll by wheel or finger either (inner scroll areas included).
  useEffect(() => {
    const root = rootRef.current;
    if (!open || !root) return;
    const stop = (e: Event) => e.preventDefault();
    root.addEventListener("wheel", stop, { passive: false });
    root.addEventListener("touchmove", stop, { passive: false });
    return () => {
      root.removeEventListener("wheel", stop);
      root.removeEventListener("touchmove", stop);
    };
  }, [open, spot === null]);

  // Go to the current step. Steps whose part is missing are passed over.
  useEffect(() => {
    if (!open) return;
    const step = STEPS[index];
    let cancelled = false;
    const pause = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

    async function go() {
      const first = settled.current === null;
      if (!first) {
        setBusy(true); // fade the old box out
        await pause(FADE_MS);
      }
      if (cancelled) return;
      setView(step.view);
      await frame();
      await frame();
      if (cancelled) return;

      const el = document.querySelector<HTMLElement>(step.target);
      if (!el || el.offsetParent === null) {
        if (index >= STEPS.length - 1) finish();
        else setIndex(index + 1);
        return;
      }

      const r = el.getBoundingClientRect();
      const offscreen = r.top < 24 || r.bottom > window.innerHeight - 24;
      if (offscreen) {
        // The light shrinks away, the page scrolls to the next part, then the light grows there.
        if (!first) setCollapsed(true);
        setSpot((s) => (s ? { top: s.top + s.height / 2, left: s.left + s.width / 2, width: 0, height: 0 } : s));
        const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        el.scrollIntoView({ block: "center", behavior: calm ? "auto" : "smooth" });
        // Wait until the page has stopped moving (or a second has passed).
        let last = Number.NaN;
        let still = 0;
        for (let i = 0; i < 70 && still < 6; i++) {
          await frame();
          if (cancelled) return;
          const top = el.getBoundingClientRect().top;
          still = Math.abs(top - last) < 0.5 ? still + 1 : 0;
          last = top;
        }
      }
      if (cancelled) return;
      const box = measure(el);
      settled.current = box;
      setTarget(box); // the new box is placed while still hidden
      setShown(index);
      setCollapsed(false);
      setSpot(box); // the light glides or grows to it
      if (!first) await pause(offscreen ? 120 : 260);
      if (cancelled) return;
      setBusy(false); // the new box fades in
    }
    go();
    return () => {
      cancelled = true;
    };
  }, [open, index, setView, finish]);

  // A resized window moves everything: measure the current part again.
  useEffect(() => {
    if (!open) return;
    const onResize = () => {
      const el = document.querySelector<HTMLElement>(STEPS[shown].target);
      if (!el || el.offsetParent === null || settled.current === null) return;
      const box = measure(el);
      settled.current = box;
      setSpot(box);
      setTarget(box);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open, shown]);

  useEffect(() => {
    if (open && spot && !busy) nextRef.current?.focus({ preventScroll: true });
  }, [open, shown, busy, spot === null]);

  if (!open || !spot || !target) return null;
  const step = STEPS[shown];
  const last = shown === STEPS.length - 1;
  const popWidth = Math.min(330, window.innerWidth - 32);
  const below = window.innerHeight - (target.top + target.height) > 210;
  const left = Math.max(16, Math.min(window.innerWidth - popWidth - 16, target.left));
  const top = below ? target.top + target.height + 12 : Math.max(16, target.top - 12 - 190);

  return createPortal(
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-title"
      className="fixed inset-0 z-80 touch-none overscroll-contain"
      onKeyDown={(e) => {
        if (e.key === "Escape") finish();
        if (e.key === "Tab") {
          // Keep the keyboard inside the tour: it has two buttons.
          e.preventDefault();
          (document.activeElement === nextRef.current ? skipRef : nextRef).current?.focus({ preventScroll: true });
        }
      }}
    >
      <div
        aria-hidden="true"
        className={`pointer-events-none fixed rounded-2xl outline-2 transition-all duration-[450ms] ease-(--ease-out-soft) [box-shadow:0_0_0_9999px_rgba(1,3,9,0.74)] ${collapsed ? "outline-transparent" : "outline-primary"}`}
        style={{ top: spot.top, left: spot.left, width: spot.width, height: spot.height }}
      />
      <div
        className="fixed grid gap-1.5 rounded-2xl border border-line-strong bg-popover p-[18px] shadow-[0_18px_40px_-14px_rgba(0,0,0,0.8)] transition-[opacity,translate] duration-200 ease-(--ease-out-soft)"
        style={{ top, left, width: popWidth, opacity: busy ? 0 : 1, translate: busy ? "0 8px" : "0 0", pointerEvents: busy ? "none" : "auto" }}
      >
        <h2 id="tour-title" className="text-[17px] font-bold tracking-tight">
          {step.title}
        </h2>
        <p className="mb-2.5 text-[14.5px] text-muted-foreground">{step.body}</p>
        <div className="flex items-center gap-2.5">
          <span className="mr-auto text-[13px] text-muted-foreground">
            Step {shown + 1} of {STEPS.length}
          </span>
          <Button ref={skipRef} variant="outline" onClick={finish}>
            Skip tour
          </Button>
          <Button ref={nextRef} onClick={() => (last ? finish() : setIndex(shown + 1))}>
            {last ? "Done" : "Next"}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
