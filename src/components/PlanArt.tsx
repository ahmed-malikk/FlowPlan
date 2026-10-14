/**
 * The route illustration at the top right of a plan: a winding route with a flag. A small dot
 * travels along it a few times. When every task is done the flag raises once and the route glows
 * (the "plan complete" moment). Hidden on tablets and phones, where the Tasks come first.
 */
export function PlanArt({ complete }: { complete: boolean }) {
  const route = "M8 116C66 116 82 40 140 40S220 106 282 86 358 22 408 32";
  return (
    <svg
      viewBox="0 0 420 150"
      aria-hidden="true"
      className={`pointer-events-none absolute top-[-6px] right-0 hidden h-[150px] w-[min(420px,44%)] min-[901px]:block print:hidden ${complete ? "fp-complete" : ""}`}
    >
      <path
        d="M8 128C70 128 78 52 140 52S224 118 286 98 362 34 412 44"
        fill="none"
        stroke="var(--edge)"
        strokeWidth="3"
        strokeLinecap="round"
        pathLength={1}
        className="fp-draw"
      />
      <path d={route} fill="none" stroke="var(--primary)" strokeWidth="4" strokeLinecap="round" pathLength={1} className="fp-draw" />
      <g fill="var(--g1)" stroke="var(--primary)" strokeWidth="3">
        <circle cx="8" cy="116" r="6" />
        <circle cx="140" cy="40" r="6" />
        <circle cx="282" cy="86" r="6" />
      </g>
      <g className="fp-flag">
        <path d="M408 32V4" stroke="var(--amber-text)" strokeWidth="3" strokeLinecap="round" />
        <path d="M408 6h22l-6 7 6 7h-22z" fill="var(--primary)" />
      </g>
      <circle r="4.5" fill="var(--amber-text)" className="motion-reduce:hidden">
        <animateMotion dur="4.5s" repeatCount="3" path={route} />
        <set attributeName="opacity" to="0" begin="13.5s" fill="freeze" />
      </circle>
    </svg>
  );
}
