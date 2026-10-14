/**
 * Everything the "How it's built" page says, in one place so it is easy to edit.
 *
 * DRAFT WORDING: the "built by" and "story" paragraphs below are a first draft written only from
 * facts that are in the repository (the PRD, the release dates). Ahmed rewrites them in his own
 * words before the v2.0 release (issue #39). Do not add personal facts that are not true.
 * This page does not mention inspiration, by Ahmed's rule for every project.
 */

export const BUILT_BY = {
  heading: "Built by Ahmed Malik",
  paragraphs: [
    "I'm Ahmed Malik. FlowPlan is a project I planned, specified, designed and shipped, from the first user story to the release notes.",
    "I wanted one question answered fast: if this task slips, does my deadline move?",
  ],
  github: { label: "More of my work on GitHub", href: "https://github.com/ahmed-malikk" },
};

export const STORY = {
  heading: "The story",
  paragraphs: [
    "FlowPlan is the first of a series of projects I am building this autumn. Version 1 took two days, 6 and 7 October 2026. In the same month it was redesigned from the screens to the workflows, keeping the planning logic and its tests exactly as they were.",
  ],
};

export const PROBLEM = {
  heading: "The problem",
  paragraphs: [
    "Small teams (student groups, two to five person startups, freelancers) plan in WhatsApp threads, sticky notes or flat to-do lists. A flat list does not show which tasks block others, so nobody knows a deadline is at risk until it is too late. Heavy tools solve this but are slow to learn and overkill for a three-week plan.",
  ],
};

export const METHOD = {
  heading: "How the critical path is found",
  intro:
    "The Critical Path Method, the same method project managers use on paper, so every result can be checked by hand. Step through it on the example plan: the numbers come from the real scheduler.",
};

export const STACK = {
  heading: "Stack",
  items: [
    "Next.js and TypeScript for the app.",
    "Tailwind CSS and shadcn/ui (built on Radix UI) for the interface, Figtree and JetBrains Mono for type, Lucide for icons.",
    "The scheduler is a set of pure functions with no React in them, so it is tested on its own.",
    "Plans are saved in your browser (localStorage). No server, no account.",
    "Vitest for unit tests, Playwright for system tests, GitHub Actions on every push, hosted on Vercel.",
  ],
};

export const ARCHITECTURE = {
  heading: "Architecture",
  alt: "Architecture: the browser app calls the scheduler library and saves plans to localStorage; on every push GitHub Actions runs the Vitest tests and the build, and Vercel hosts the app.",
};

/** Update both numbers at each release from the real test run (issue #39). */
export const TESTING = {
  heading: "Testing",
  unitTests: 119,
  items: [
    "Unit tests cover the scheduler, the plan helpers, the diagram's layout and the contrast of every colour pair.",
    "System tests drive the real app in desktop Edge, desktop Chrome and a 375 px phone view.",
    "Every bug found becomes a test.",
  ],
};

export const LINKS = {
  heading: "Links",
  items: [
    { label: "Live app", note: "flow-plan-five.vercel.app", href: "https://flow-plan-five.vercel.app" },
    { label: "Source code", note: "GitHub", href: "https://github.com/ahmed-malikk/FlowPlan" },
    { label: "Product requirements", note: "PRD", href: "https://github.com/ahmed-malikk/FlowPlan/blob/main/docs/PRD.md" },
    { label: "Test report", note: "Results and defects", href: "https://github.com/ahmed-malikk/FlowPlan/blob/main/docs/test-report.md" },
  ],
};

export const CREDITS = {
  heading: "Credits",
  items: [
    "Figtree and JetBrains Mono, under the SIL Open Font License.",
    "Lucide icons (ISC), Radix UI and shadcn/ui (MIT).",
  ],
};
