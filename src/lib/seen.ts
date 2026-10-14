/**
 * Remembers which one-time hints a visitor has already seen (the first-visit tour, the slack tip),
 * so each shows once. Storage can be blocked (some private modes), so every call is guarded and the
 * hint is remembered for the rest of the visit in memory instead.
 */
type Store = Pick<Storage, "getItem" | "setItem">;

const PREFIX = "flowplan:seen:";
const remembered = new Set<string>(); // fallback for the current visit when storage is blocked

function browserStore(): Store | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function hasSeen(key: string, store: Store | null = browserStore()): boolean {
  if (remembered.has(key)) return true;
  try {
    return store?.getItem(PREFIX + key) === "1";
  } catch {
    return false;
  }
}

export function markSeen(key: string, store: Store | null = browserStore()): void {
  remembered.add(key);
  try {
    store?.setItem(PREFIX + key, "1");
  } catch {
    /* blocked: the in-memory note above still covers this visit */
  }
}

/** For tests: forget the in-memory notes. */
export function resetSeenMemory(): void {
  remembered.clear();
}
