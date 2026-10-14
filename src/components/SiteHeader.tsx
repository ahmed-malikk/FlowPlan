"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/LogoMark";
import { useNewProject } from "@/components/NewProjectProvider";
import { Button } from "@/components/ui/button";
import { pageTitle, sectionFor } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { useProjects } from "@/lib/useProjects";

/**
 * The one header. On wide screens: logo, navigation, "How it's built" and New project.
 * On a phone the logo mark and the page title take the left, and the tab bar carries navigation.
 * A route-map line runs behind the right-hand side and fades out before it reaches the buttons.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const projects = useProjects();
  const newProject = useNewProject();
  const section = sectionFor(pathname);
  const planId = section === "plan" ? pathname.split("/")[2] : null;
  const planName = planId ? projects?.find((p) => p.id === planId)?.name : undefined;

  const navLink = (current: boolean) =>
    cn(
      "rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:text-foreground",
      current && "bg-secondary/85 text-foreground",
    );

  return (
    <header className="relative overflow-hidden border-b border-border/60 bg-linear-to-r from-g0/95 via-[#061237]/80 to-[#0e2460]/70">
      <HeaderArt />
      <div className="relative flex h-[66px] items-center gap-3 px-3.5 min-[521px]:px-[22px]">
        <Link href="/" className="flex items-center gap-2.5 rounded-md text-lg font-bold tracking-tight" aria-label="FlowPlan, your plans">
          <LogoMark />
          <span className="max-[520px]:hidden">FlowPlan</span>
        </Link>

        <nav aria-label="Main" className="ml-3 hidden items-center gap-1 md:flex print:hidden">
          <Link href="/" className={navLink(section === "plans")} aria-current={section === "plans" ? "page" : undefined}>
            Projects
          </Link>
          {section === "plan" && (
            <span className={navLink(true)} aria-current="page">
              {planName ?? "Plan"}
            </span>
          )}
        </nav>

        <span className="min-w-0 flex-1 truncate font-semibold min-[521px]:hidden">{pageTitle(pathname, planName)}</span>
        <span className="flex-1 max-[520px]:hidden" />

        <Button asChild variant="outline" className="max-[520px]:hidden print:hidden">
          <Link href="/how-its-built" aria-current={section === "built" ? "page" : undefined}>
            How it&apos;s built
          </Link>
        </Button>
        <Button onClick={newProject.open} className="print:hidden">
          <span className="max-[520px]:hidden">New project</span>
          <span className="min-[521px]:hidden">New</span>
        </Button>
      </div>
    </header>
  );
}

/** Two quiet blue lines and one amber line with stations, faded out behind the buttons. */
function HeaderArt() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full max-[520px]:hidden"
      viewBox="0 0 1280 66"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="fp-header-fade" x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset=".28" stopColor="#fff" stopOpacity=".25" />
          <stop offset=".55" stopColor="#fff" stopOpacity="1" />
          <stop offset=".74" stopColor="#fff" stopOpacity=".9" />
          <stop offset=".84" stopColor="#fff" stopOpacity=".12" />
          <stop offset="1" stopColor="#fff" stopOpacity=".12" />
        </linearGradient>
        <mask id="fp-header-mask">
          <rect width="1280" height="66" fill="url(#fp-header-fade)" />
        </mask>
      </defs>
      <g mask="url(#fp-header-mask)" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M250 54H420L450 24H640L670 54H860L890 24H1280" stroke="#1f3877" strokeWidth="2" />
        <path d="M400 12H540L568 40H760L788 12H990L1018 40H1280" stroke="#2a4590" strokeWidth="2" opacity=".85" />
        <path d="M540 34H700L730 58H900L930 34H1280" pathLength={1} stroke="var(--primary)" strokeWidth="2.5" opacity=".75" className="fp-draw" />
        <g fill="#050d26" stroke="var(--primary)" strokeWidth="2.5">
          <circle cx="700" cy="34" r="4.5" />
          <circle cx="900" cy="58" r="4.5" />
          <circle cx="1110" cy="34" r="4.5" />
        </g>
        <g fill="#050d26" stroke="#2a4590" strokeWidth="2">
          <circle cx="540" cy="12" r="4" />
          <circle cx="760" cy="40" r="4" />
          <circle cx="990" cy="12" r="4" />
        </g>
      </g>
    </svg>
  );
}
