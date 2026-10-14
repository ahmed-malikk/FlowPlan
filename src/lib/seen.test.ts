import { beforeEach, describe, expect, it } from "vitest";
import { hasSeen, markSeen, resetSeenMemory } from "./seen";

function fakeStore() {
  const data = new Map<string, string>();
  return { data, getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
}

const blocked = {
  getItem: () => {
    throw new Error("storage blocked");
  },
  setItem: () => {
    throw new Error("storage blocked");
  },
};

describe("hasSeen and markSeen", () => {
  beforeEach(() => resetSeenMemory());

  it("starts unseen and remembers once marked", () => {
    const store = fakeStore();
    expect(hasSeen("tour", store)).toBe(false);
    markSeen("tour", store);
    expect(hasSeen("tour", store)).toBe(true);
  });

  it("stores the note under a FlowPlan key, so it survives a reload", () => {
    const store = fakeStore();
    markSeen("tour", store);
    resetSeenMemory(); // a new page load has no memory, only storage
    expect(hasSeen("tour", store)).toBe(true);
    expect([...store.data.keys()]).toEqual(["flowplan:seen:tour"]);
  });

  it("keeps different hints apart", () => {
    const store = fakeStore();
    markSeen("tour", store);
    expect(hasSeen("slack", store)).toBe(false);
  });

  it("falls back to memory for the visit when storage is blocked", () => {
    expect(hasSeen("tour", blocked)).toBe(false);
    markSeen("tour", blocked); // must not throw
    expect(hasSeen("tour", blocked)).toBe(true);
  });

  it("works with no storage at all", () => {
    expect(hasSeen("tour", null)).toBe(false);
    markSeen("tour", null);
    expect(hasSeen("tour", null)).toBe(true);
  });
});
