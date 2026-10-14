"use client";

import { Info, LayoutGrid, Route } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { lastPlanId, sectionFor, type Section } from "@/lib/nav";
import { cn } from "@/lib/utils";

/**
 * The phone's navigation, within thumb reach: Plans, the plan you had open, How it's built.
 * It only shows at phone width (up to 520 px) and respects the home indicator.
 */
export function TabBar() {
  const pathname = usePathname();
  const section = sectionFor(pathname);
  const [planId, setPlanId] = useState<string | null>(null);

  // Re-read on every navigation: the plan page records itself as the last plan when it opens.
  useEffect(() => {
    setPlanId(lastPlanId());
  }, [pathname]);

  const tab = (current: boolean) =>
    cn(
      "grid h-[52px] flex-1 place-items-center gap-0.5 rounded-xl text-xs font-semibold text-muted-foreground",
      current && "bg-secondary/70 text-amber-text",
    );
  const item = (target: Section, href: string, label: string, Icon: typeof Route) => (
    <Link key={target} href={href} className={tab(section === target)} aria-current={section === target ? "page" : undefined}>
      <Icon className="size-[22px]" aria-hidden="true" />
      {label}
    </Link>
  );

  return (
    <nav
      aria-label="Sections"
      className="sticky bottom-0 z-30 hidden border-t border-border bg-g1 px-2 pt-1.5 pb-[max(6px,env(safe-area-inset-bottom))] max-[520px]:flex print:hidden"
    >
      {item("plans", "/", "Plans", LayoutGrid)}
      {planId && item("plan", `/project/${planId}`, "Plan", Route)}
      {item("built", "/how-its-built", "How it's built", Info)}
    </nav>
  );
}
