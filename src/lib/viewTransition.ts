/**
 * Opening a plan from the Projects page morphs the card's mini route into the plan's diagram.
 * It uses the browser's View Transitions API and falls back to a plain page change where that is
 * missing or when the visitor prefers reduced motion.
 */
type ViewTransitionDocument = Document & { startViewTransition?: (update: () => Promise<void> | void) => unknown };

export const ROUTE_TRANSITION_NAME = "route";

/** Resolves when `selector` exists, or after `maxMs`, whichever comes first. */
function whenPresent(selector: string, maxMs: number): Promise<void> {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) return resolve();
    const done = () => {
      observer.disconnect();
      clearTimeout(timer);
      resolve();
    };
    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) done();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    const timer = setTimeout(done, maxMs);
  });
}

/**
 * Runs `go` (a router push) inside a view transition. `source` is the element that should morph;
 * the destination marks its diagram with `data-flow-board`, which carries the same transition name.
 */
export function navigateWithRouteTransition(source: Element | null, go: () => void): void {
  const doc = document as ViewTransitionDocument;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!doc.startViewTransition || reduce || !source) return go();

  const el = source as HTMLElement;
  el.style.viewTransitionName = ROUTE_TRANSITION_NAME;
  doc.startViewTransition(async () => {
    el.style.viewTransitionName = "";
    go();
    await whenPresent("[data-flow-board]", 700);
  });
}
