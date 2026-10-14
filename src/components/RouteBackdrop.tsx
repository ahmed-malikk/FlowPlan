/**
 * Faint route-map lines behind the whole page: lines that bend at 45 degrees with stations at the
 * bends, like a transit map. Static and low contrast, so it never competes with the content.
 */
export function RouteBackdrop() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full print:hidden"
      viewBox="0 0 1280 1600"
      preserveAspectRatio="xMidYMin slice"
      aria-hidden="true"
    >
      <g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
        <path d="M-20 420H260L310 470H620L670 420H980L1030 470H1300" stroke="#16306b" opacity=".55" />
        <path d="M-20 760H180L260 840H520L600 760H900L980 840H1300" stroke="#16306b" opacity=".5" />
        <path d="M-20 1120H340L420 1040H760L840 1120H1300" stroke="#1b3a80" opacity=".45" />
        <path d="M200 -20V300L260 360V700L320 760V1100L380 1160V1620" stroke="#16306b" opacity=".4" />
        <path d="M1000 -20V240L940 300V620L1000 680V980L940 1040V1620" stroke="#1b3a80" opacity=".35" />
        <path d="M-20 600H400L460 540H900L960 600H1300" stroke="var(--primary)" opacity=".14" />
      </g>
      <g fill="#050d26" stroke="#1f3877" strokeWidth="2">
        <circle cx="310" cy="470" r="6" />
        <circle cx="670" cy="420" r="6" />
        <circle cx="600" cy="760" r="6" />
        <circle cx="840" cy="1120" r="6" />
        <circle cx="260" cy="360" r="6" />
        <circle cx="940" cy="300" r="6" />
      </g>
      <g fill="#050d26" stroke="var(--primary)" strokeWidth="2" opacity=".3">
        <circle cx="460" cy="540" r="6" />
        <circle cx="900" cy="540" r="6" />
      </g>
    </svg>
  );
}
