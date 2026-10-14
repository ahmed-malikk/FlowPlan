/**
 * Where everything goes when the flow diagram is drawn: node boxes and the curves between them.
 * Wide boards run left to right; narrow boards (a phone) run top to bottom so there is never a
 * sideways pan. Pure functions with no React, so the geometry is tested on its own.
 */
import type { FlowStructure } from "./flowLayout";

export const NODE_W = 146;
export const NODE_H = 72;
export const MIN_NODE_W = 112; // nodes shrink to this before the board starts to scroll
export const VERTICAL_BELOW = 560; // board width in px under which the diagram turns top to bottom

export type Box = { x: number; y: number; w: number };
export type EdgeShape = { from: string; to: string; d: string; critical: boolean; level: number };
export type Geometry = {
  vertical: boolean;
  width: number; // content size; the board scrolls when this is wider than the board
  height: number;
  nodes: Record<string, Box>;
  edges: EdgeShape[];
};

/** `size` is the board's current width and height in px. */
export function flowGeometry(flow: FlowStructure, size: { width: number; height: number }): Geometry {
  const vertical = size.width < VERTICAL_BELOW;
  const nodes: Record<string, Box> = {};
  let width = size.width;
  let height = size.height;

  if (vertical) {
    // At most two tasks per line, so names stay readable; a level with more tasks wraps to the next line.
    const perLine = Math.min(2, Math.max(1, flow.maxRows));
    const gap = 12;
    const w = Math.min(190, Math.floor((size.width - 32 - (perLine - 1) * gap) / perLine));
    const step = NODE_H + 30;
    const linesIn = new Map<number, number>();
    for (const n of flow.nodes) linesIn.set(n.level, Math.ceil(n.rowsInLevel / perLine));
    const firstLine = new Map<number, number>();
    let lines = 0;
    for (let l = 0; l < flow.levels; l++) {
      firstLine.set(l, lines);
      lines += linesIn.get(l) ?? 1;
    }
    height = 28 + lines * step;
    for (const n of flow.nodes) {
      const line = Math.floor(n.row / perLine);
      const col = n.row % perLine;
      const onThisLine = Math.min(perLine, n.rowsInLevel - line * perLine);
      const rowWidth = onThisLine * w + (onThisLine - 1) * gap;
      nodes[n.id] = { x: (size.width - rowWidth) / 2 + col * (w + gap), y: 18 + (firstLine.get(n.level)! + line) * step, w };
    }
  } else {
    // Same layout as the design: full-size nodes spread across the board. When five or more levels would
    // not fit, the nodes narrow (never below MIN_NODE_W) so the whole route is visible; only then does it scroll.
    const levels = Math.max(1, flow.levels);
    const room = size.width - 48;
    const nodeW = levels * NODE_W + (levels - 1) * 16 <= room ? NODE_W : Math.max(MIN_NODE_W, Math.floor((room - (levels - 1) * 16) / levels));
    const pitch = levels > 1 ? Math.max(nodeW + 16, Math.floor((room - nodeW) / (levels - 1))) : 0;
    // In a short board the rows move a little closer (never touching) so no vertical scrollbar is needed.
    const step = Math.min(NODE_H + 26, Math.max(NODE_H + 10, Math.floor((size.height - 20) / flow.maxRows)));
    const contentHeight = flow.maxRows * step + 20;
    height = Math.max(size.height, contentHeight);
    const top = (height - contentHeight) / 2 + 10;
    width = Math.max(size.width, 24 + (levels - 1) * pitch + nodeW + 24);
    for (const n of flow.nodes) {
      nodes[n.id] = { x: 24 + n.level * pitch, y: top + ((flow.maxRows - n.rowsInLevel) * step) / 2 + n.row * step, w: nodeW };
    }
  }

  const level = new Map(flow.nodes.map((n) => [n.id, n.level]));
  const edges: EdgeShape[] = flow.edges.map((e) => {
    const a = nodes[e.from];
    const b = nodes[e.to];
    let d: string;
    if (vertical) {
      // Out of the bottom of the first node, into the top of the second; the arrow tip stops 2 px short.
      const x1 = a.x + a.w / 2;
      const y1 = a.y + NODE_H;
      const x2 = b.x + b.w / 2;
      const y2 = b.y - 2;
      const my = (y1 + y2) / 2;
      d = `M${x1} ${y1}C${x1} ${my} ${x2} ${my} ${x2} ${y2}`;
    } else {
      const x1 = a.x + a.w;
      const y1 = a.y + NODE_H / 2;
      const x2 = b.x - 2;
      const y2 = b.y + NODE_H / 2;
      const mx = (x1 + x2) / 2;
      d = `M${x1} ${y1}C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`;
    }
    return { from: e.from, to: e.to, d, critical: e.critical, level: level.get(e.from) ?? 0 };
  });

  return { vertical, width, height, nodes, edges };
}
