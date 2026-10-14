/** A winding route with three stations and a flag. It draws itself in. Used by the empty states. */
export function RouteIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 360 150" aria-hidden="true" className={className}>
      <path
        d="M20 120C80 120 90 40 150 40S230 110 290 92 330 40 344 44"
        fill="none"
        stroke="var(--edge)"
        strokeWidth="3"
        strokeLinecap="round"
        pathLength={1}
        className="fp-draw"
      />
      <path
        d="M20 108C76 108 94 30 150 30S226 98 286 80 326 30 340 34"
        fill="none"
        stroke="var(--primary)"
        strokeWidth="4"
        strokeLinecap="round"
        pathLength={1}
        className="fp-draw"
      />
      <g fill="var(--g1)" stroke="var(--primary)" strokeWidth="3">
        <circle cx="20" cy="108" r="7" />
        <circle cx="150" cy="30" r="7" />
        <circle cx="286" cy="80" r="7" />
      </g>
      <path d="M340 34V6" stroke="var(--amber-text)" strokeWidth="3" strokeLinecap="round" />
      <path d="M340 8h22l-6 7 6 7h-22z" fill="var(--primary)" />
    </svg>
  );
}
