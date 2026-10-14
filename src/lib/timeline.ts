/**
 * Day marks along the printed timeline. A plan of 12 days gets a mark every day; a plan of 300 days
 * gets a few round numbers. Pure and tested so the printed axis is never a wall of numbers.
 */
export type DayTick = { day: number; label: boolean };

const STEPS = [1, 2, 5, 7, 10, 14, 20, 30, 50, 100];

/** Spacing between marks that gives at most about 14 marks along the axis. */
export function tickStep(span: number): number {
  for (const step of STEPS) if (span / step <= 14) return step;
  return Math.ceil(span / 14 / 100) * 100;
}

/** Marks from day 0 to the finish. The last mark always sits on the finish day; its label is dropped if it would crowd the one before. */
export function dayTicks(span: number): DayTick[] {
  const total = Math.max(1, Math.round(span));
  const step = tickStep(total);
  const days: number[] = [];
  for (let d = 0; d <= total; d += step) days.push(d);
  if (days[days.length - 1] !== total) days.push(total);
  return days.map((day, i) => ({
    day,
    label: !(i === days.length - 1 && i > 0 && day - days[i - 1] < step / 2),
  }));
}
