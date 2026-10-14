/**
 * Where the visitor is, for the header and the phone tab bar.
 * Pure functions plus a tiny "last opened plan" memory, so the tab bar can jump back to it.
 */
export type Section = "plans" | "plan" | "built";

export const LAST_PLAN_KEY = "flowplan:last-plan";

/** Which part of the app a path belongs to, or null for anything else (for example a 404). */
export function sectionFor(pathname: string): Section | null {
  if (pathname === "/") return "plans";
  if (pathname.startsWith("/project/")) return "plan";
  if (pathname === "/how-its-built") return "built";
  return null;
}

/** The short page title shown in the phone header, where there is no room for the nav. */
export function pageTitle(pathname: string, planName?: string): string {
  const section = sectionFor(pathname);
  if (section === "plans") return "Your plans";
  if (section === "plan") return planName?.trim() || "Plan";
  if (section === "built") return "How it's built";
  return "FlowPlan";
}

/** Remembers the plan that was opened last. Storage can be blocked, so every call is guarded. */
export function rememberPlan(id: string): void {
  try {
    window.localStorage.setItem(LAST_PLAN_KEY, id);
  } catch {
    /* storage blocked: the tab bar simply has no Plan shortcut */
  }
}

export function lastPlanId(): string | null {
  try {
    return window.localStorage.getItem(LAST_PLAN_KEY);
  } catch {
    return null;
  }
}
