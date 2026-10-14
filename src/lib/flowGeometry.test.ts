import { describe, expect, it } from "vitest";
import { flowStructure } from "./flowLayout";
import { flowGeometry, NODE_H, VERTICAL_BELOW } from "./flowGeometry";
import { exampleProject } from "./plan";
import { schedule } from "./scheduler";

const result = schedule(exampleProject("2026-10-14"));
if (!result.ok) throw new Error("example project should schedule");
const flow = flowStructure(result.tasks);
const idOf = (name: string) => result.tasks.find((t) => t.name === name)!.id;

const overlap = (a: { x: number; y: number; w: number }, b: { x: number; y: number; w: number }) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + NODE_H && b.y < a.y + NODE_H;

function noneOverlap(boxes: Array<{ x: number; y: number; w: number }>) {
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) expect(overlap(boxes[i], boxes[j])).toBe(false);
}

describe("flowGeometry on a wide board", () => {
  const g = flowGeometry(flow, { width: 900, height: 420 });

  it("runs left to right", () => {
    expect(g.vertical).toBe(false);
    const x = (name: string) => g.nodes[idOf(name)].x;
    expect(x("Requirements")).toBeLessThan(x("UI design"));
    expect(x("UI design")).toBeLessThan(x("Backend API"));
    expect(x("Backend API")).toBeLessThan(x("Testing"));
    expect(x("Testing")).toBeLessThan(x("Deploy"));
  });

  it("keeps every node on the board and never lets two overlap", () => {
    const boxes = Object.values(g.nodes);
    for (const b of boxes) {
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x + b.w).toBeLessThanOrEqual(g.width);
      expect(b.y).toBeGreaterThanOrEqual(0);
      expect(b.y + NODE_H).toBeLessThanOrEqual(g.height);
    }
    noneOverlap(boxes);
  });

  it("has one curve per dependency and carries the critical flag", () => {
    expect(g.edges).toHaveLength(flow.edges.length);
    expect(g.edges.filter((e) => e.critical)).toHaveLength(flow.edges.filter((e) => e.critical).length);
    expect(g.edges.every((e) => e.d.startsWith("M"))).toBe(true);
  });

  it("grows wider than the board when there is not room, so the board scrolls instead of squeezing", () => {
    const tight = flowGeometry(flow, { width: VERTICAL_BELOW, height: 420 });
    expect(tight.vertical).toBe(false);
    expect(tight.width).toBeGreaterThan(VERTICAL_BELOW);
  });
});

describe("flowGeometry on a phone", () => {
  const g = flowGeometry(flow, { width: 340, height: 600 });

  it("turns top to bottom so there is no sideways pan", () => {
    expect(g.vertical).toBe(true);
    const y = (name: string) => g.nodes[idOf(name)].y;
    expect(y("Requirements")).toBeLessThan(y("UI design"));
    expect(y("UI design")).toBeLessThan(y("Backend API"));
    expect(y("Testing")).toBeLessThan(y("Deploy"));
  });

  it("fits the width, with parallel tasks side by side and no overlaps", () => {
    const boxes = Object.values(g.nodes);
    for (const b of boxes) {
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x + b.w).toBeLessThanOrEqual(340);
    }
    noneOverlap(boxes);
    expect(g.width).toBe(340);
  });

  it("puts at most two tasks on a line, so names stay readable, and wraps the third", () => {
    const parallel = ["Backend API", "Frontend", "User docs"].map((n) => g.nodes[idOf(n)]);
    expect(new Set(parallel.map((b) => b.y)).size).toBe(2);
    expect(parallel.every((b) => b.w >= 140)).toBe(true);
  });
});
