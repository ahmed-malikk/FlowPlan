/**
 * Save/load projects in the browser's localStorage. No backend in v1.
 *
 * Shaped as a tiny store (subscribe + getSnapshot) so React can read it with
 * useSyncExternalStore, and edits in one tab show up in other open tabs.
 */
import { MAX_NOTES } from "./plan";
import type { Project, Task } from "./scheduler";

export const STORAGE_KEY = "flowplan:projects:v1";

/** Reads stored JSON defensively: anything malformed is dropped instead of crashing the app. */
export function parseProjects(raw: string | null): Project[] {
  if (!raw) return [];
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];
  return data.flatMap((p): Project[] => {
    if (!isObject(p) || typeof p.id !== "string" || typeof p.name !== "string") return [];
    const tasks = Array.isArray(p.tasks) ? p.tasks.flatMap(parseTask) : [];
    const startDate = typeof p.startDate === "string" ? p.startDate : new Date().toISOString().slice(0, 10);
    return [{ id: p.id, name: p.name, startDate, tasks }];
  });
}

function parseTask(t: unknown): Task[] {
  if (!isObject(t) || typeof t.id !== "string" || typeof t.name !== "string") return [];
  const duration = Number(t.duration);
  if (!Number.isInteger(duration) || duration < 1) return [];
  const dependsOn = Array.isArray(t.dependsOn) ? t.dependsOn.filter((d): d is string => typeof d === "string") : [];
  const task: Task = { id: t.id, name: t.name, duration, dependsOn };
  if (typeof t.owner === "string" && t.owner) task.owner = t.owner;
  if (t.done === true) task.done = true;
  if (typeof t.notes === "string" && t.notes.trim()) task.notes = t.notes.trim().slice(0, MAX_NOTES);
  return [task];
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

// ---- Store ----

const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cached: Project[] = [];

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null; // storage blocked (e.g. some private modes): app still works for this visit
  }
}

/** Same array back until the stored data changes, as useSyncExternalStore requires. */
export function getProjects(): Project[] {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cached = parseProjects(raw);
  }
  return cached;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function saveProjects(projects: Project[]): void {
  const raw = JSON.stringify(projects);
  try {
    window.localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    // Quota or blocked storage: keep the in-memory copy so the session isn't lost.
  }
  cachedRaw = raw;
  cached = projects;
  listeners.forEach((l) => l());
}

export function addProject(project: Project): void {
  saveProjects([...getProjects(), project]);
}

export function updateProject(id: string, change: (p: Project) => Project): void {
  saveProjects(getProjects().map((p) => (p.id === id ? change(p) : p)));
}

export function deleteProject(id: string): void {
  saveProjects(getProjects().filter((p) => p.id !== id));
}
