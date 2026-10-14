import { describe, expect, it } from "vitest";
import { criticalChange, criticalIds } from "./criticalChange";
import { exampleProject, setDuration } from "./plan";
import { schedule, type ScheduledTask } from "./scheduler";

function scheduled(tasks = exampleProject("2026-10-14").tasks): ScheduledTask[] {
  const result = schedule({ tasks });
  if (!result.ok) throw new Error("should schedule");
  return result.tasks;
}

describe("criticalChange", () => {
  const base = exampleProject("2026-10-14").tasks;
  const id = (name: string) => base.find((t) => t.name === name)!.id;

  it("says nothing the first time, when there is nothing to compare with", () => {
    expect(criticalChange(null, scheduled(base)).message).toBeNull();
  });

  it("says nothing when the critical path stays the same", () => {
    const before = criticalIds(scheduled(base));
    const longerButSamePath = scheduled(setDuration(base, id("Backend API"), 5)); // still on the path
    expect(criticalChange(before, longerButSamePath).message).toBeNull();
  });

  it("names the task that joined the critical path and the ones that left it", () => {
    const before = criticalIds(scheduled(base));
    // Frontend (3 days, 1 day of slack) grows to 6 days: it now decides the finish, Backend API no longer does.
    const after = scheduled(setDuration(base, id("Frontend"), 6));
    const change = criticalChange(before, after);
    expect(change.became).toEqual(["Frontend"]);
    expect(change.stopped).toEqual(["Backend API"]);
    expect(change.message).toBe("Frontend is now critical. Backend API is no longer critical.");
  });

  it("uses plural wording for several tasks", () => {
    const before = new Set<string>();
    const change = criticalChange(before, scheduled(base));
    expect(change.became.length).toBeGreaterThan(1);
    expect(change.message).toMatch(/ are now critical\.$/);
  });

  it("ignores tasks that were deleted", () => {
    const before = criticalIds(scheduled(base));
    const withoutDocs = scheduled(base.filter((t) => t.name !== "User docs").map((t) => ({ ...t, dependsOn: t.dependsOn.filter((d) => d !== id("User docs")) })));
    expect(criticalChange(before, withoutDocs).stopped).not.toContain("User docs");
  });
});
