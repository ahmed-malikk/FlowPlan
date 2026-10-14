/**
 * How far down its scroll range the page is, from 0 (top) to 1 (bottom), for the phone scroll
 * indicator. Returns null when the page does not scroll (so nothing is shown), and stays between 0
 * and 1 when the page is over-scrolled (the rubber band on a phone).
 */
export function scrollProgress(scrollTop: number, scrollHeight: number, clientHeight: number): number | null {
  const range = scrollHeight - clientHeight;
  if (range <= 1) return null;
  return Math.min(1, Math.max(0, scrollTop / range));
}
