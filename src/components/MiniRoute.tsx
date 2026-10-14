import { flowStructure } from "@/lib/flowLayout";
import type { ScheduledTask } from "@/lib/scheduler";

const W = 280;
const H = 96;
const PAD = 20;

/**
 * A plan drawn as a small route: one station per task, lines between the tasks that wait for
 * each other. The critical path is amber, everything else blue. The lines draw themselves in.
 */
export function MiniRoute({ tasks, className, ref }: { tasks: ScheduledTask[]; className?: string; ref?: React.Ref<SVGSVGElement> }) {
  const flow = flowStructure(tasks);
  if (flow.nodes.length === 0) {
    return (
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" className={className}>
        <path d={`M${PAD} ${H / 2}H${W - PAD}`} stroke="var(--edge)" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 9" fill="none" />
      </svg>
    );
  }

  const xGap = flow.levels > 1 ? (W - PAD * 2) / (flow.levels - 1) : 0;
  const yGap = flow.maxRows > 1 ? Math.min(32, (H - PAD * 2) / (flow.maxRows - 1)) : 0;
  const at = (id: string) => {
    const n = flow.nodes.find((x) => x.id === id)!;
    return { x: flow.levels > 1 ? PAD + n.level * xGap : W / 2, y: H / 2 + (n.row - (n.rowsInLevel - 1) / 2) * yGap, level: n.level };
  };

  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" className={className}>
      {flow.edges.map((e, i) => {
        const a = at(e.from);
        const b = at(e.to);
        const mx = (a.x + b.x) / 2;
        return (
          <path
            key={i}
            d={`M${a.x} ${a.y}C${mx} ${a.y} ${mx} ${b.y} ${b.x} ${b.y}`}
            fill="none"
            stroke={e.critical ? "var(--primary)" : "var(--edge)"}
            strokeWidth={e.critical ? 4 : 3}
            strokeLinecap="round"
            pathLength={1}
            className="fp-draw"
            style={{ animationDelay: `${0.15 + a.level * 0.12}s` }}
          />
        );
      })}
      {flow.nodes.map((n) => {
        const p = at(n.id);
        return <circle key={n.id} cx={p.x} cy={p.y} r="6" fill="var(--g1)" stroke={n.critical ? "var(--primary)" : "var(--edge)"} strokeWidth="3" />;
      })}
    </svg>
  );
}
