import { ARCHITECTURE } from "@/content/howItsBuilt";

/** How the pieces connect: the app calls the scheduler and saves to the browser; GitHub tests and Vercel hosts. */
export function ArchitectureDiagram() {
  return (
    <svg viewBox="0 0 760 210" role="img" aria-label={ARCHITECTURE.alt} className="mt-1.5 h-auto w-full max-w-[760px]">
      <defs>
        <marker id="fp-arch-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 1L9 5L0 9z" fill="var(--primary)" />
        </marker>
      </defs>
      <g fill="var(--surface-2)" stroke="var(--line-strong)" strokeWidth="1.5">
        <rect x="10" y="60" width="170" height="70" rx="14" />
        <rect x="295" y="14" width="190" height="70" rx="14" stroke="var(--primary)" />
        <rect x="295" y="126" width="190" height="70" rx="14" />
        <rect x="580" y="14" width="170" height="70" rx="14" />
        <rect x="580" y="126" width="170" height="70" rx="14" />
      </g>
      <g fill="none" stroke="var(--primary)" strokeWidth="2.5" markerEnd="url(#fp-arch-arrow)">
        <path d="M180 85C230 85 250 49 293 49" pathLength={1} className="fp-draw" />
        <path d="M180 105C230 105 250 161 293 161" pathLength={1} className="fp-draw" style={{ animationDelay: "0.3s" }} />
        <path d="M485 49H578" pathLength={1} className="fp-draw" style={{ animationDelay: "0.6s" }} />
        <path d="M485 161H578" pathLength={1} className="fp-draw" style={{ animationDelay: "0.8s" }} />
      </g>
      <g fill="var(--foreground)" fontSize="14" fontWeight="700" textAnchor="middle">
        <text x="95" y="91">Browser app</text>
        <text x="390" y="46">Scheduler library</text>
        <text x="390" y="158">localStorage</text>
        <text x="665" y="46">Vitest tests</text>
        <text x="665" y="158">Vercel hosting</text>
      </g>
      <g fill="var(--muted-foreground)" fontSize="12" textAnchor="middle">
        <text x="95" y="110">Next.js, TypeScript</text>
        <text x="390" y="66">critical path, slack</text>
        <text x="390" y="178">plans saved here</text>
        <text x="665" y="66">plus Playwright</text>
        <text x="665" y="178">deployed from GitHub</text>
      </g>
    </svg>
  );
}
