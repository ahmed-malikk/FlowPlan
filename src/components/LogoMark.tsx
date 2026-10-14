/**
 * The FlowPlan mark: an amber tile with a short route. The line draws itself and the two
 * stations pop in when the page first loads (the header stays mounted while you navigate).
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true" className={className}>
      <rect width="30" height="30" rx="9" fill="var(--primary)" />
      <path
        d="M7 20h6l4-9h6"
        pathLength={1}
        fill="none"
        stroke="var(--primary-foreground)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="fp-logo-line"
      />
      <circle cx="7" cy="20" r="2.2" fill="var(--primary-foreground)" className="fp-dot-pop [animation-delay:0.2s]" />
      <circle cx="23" cy="11" r="2.2" fill="var(--primary-foreground)" className="fp-dot-pop [animation-delay:0.75s]" />
    </svg>
  );
}
