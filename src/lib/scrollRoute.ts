/**
 * The route on the How it's built page fills as you scroll. These two functions turn scroll
 * positions into "how far along" and "has this station been reached", so the maths is tested.
 */

/**
 * How much of the route to fill, from 0 to 1. `top` is where the route's block starts relative to
 * the top of the window, `height` is its height, and the line is drawn down to 65 % of the window.
 */
export function routeProgress(top: number, height: number, viewport: number): number {
  if (height <= 0) return 0;
  const reached = (viewport * 0.65 - top) / height;
  return Math.min(1, Math.max(0, reached));
}

/** A station lights up once its section has scrolled up past 65 % of the window. */
export function stationReached(sectionTop: number, viewport: number): boolean {
  return sectionTop < viewport * 0.65;
}
