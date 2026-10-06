"use client";

import { useSyncExternalStore } from "react";
import type { Project } from "./scheduler";
import { getProjects, subscribe } from "./storage";

/**
 * All saved projects, or null during server render / before the browser store is read.
 * Rendering a loading state for null avoids hydration mismatches.
 */
export function useProjects(): Project[] | null {
  return useSyncExternalStore<Project[] | null>(subscribe, getProjects, () => null);
}
