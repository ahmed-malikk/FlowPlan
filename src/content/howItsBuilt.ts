/**
 * Everything the "How it's built" page says, in one place so it is easy to edit.
 *
 * The wording is written from facts that are in the repository (the PRD, tags, commit history).
 * Ahmed delegated it; do not add personal facts that are not true.
 * This page does not mention inspiration, by Ahmed's rule for every project.
 */

export const BUILT_BY = {
  heading: "Built by Ahmed Malik",
  paragraphs: [
    "I'm Ahmed Malik, a computer science graduate from UET Lahore. FlowPlan is the first project in my portfolio, and I took it from the first user story to the release notes: I wrote the product requirements, built the scheduler and the interface, tested it and shipped it.",
    "The question I wanted answered fast is the one a flat to-do list cannot: if this task slips, does my deadline move?",
  ],
  github: { label: "More of my work on GitHub", href: "https://github.com/ahmed-malikk" },
};

export const STORY = {
  heading: "The story",
  paragraphs: [
    "I wrote the product requirements on 6 October 2026 and released version 1 the next day. A week later I redesigned the whole interface, from the screens to the way you add and edit tasks, and kept the planning logic and its original tests exactly as they were.",
    "I built it one feature at a time. Each feature is a GitHub issue with acceptance criteria, gets its own commit that closes the issue, and has to pass the tests and the build before it is pushed. The history on GitHub shows the order I worked in.",
    "The redesign added a diagram of the plan next to the task list, a note when an edit changes the critical path, undo after a delete, and a phone layout of its own with a Tasks and Diagram switch.",
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
    "Plans are saved in your browser (localStorage). No server and no account; the live site only counts anonymous page views.",
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
  unitTests: 132,
  items: [
    "Unit tests cover the scheduler, the plan helpers, the diagram's layout and the contrast of every colour pair.",
    "System tests drive the real app in desktop Edge, desktop Chrome and a 375 px phone view.",
    "Bugs found by testing are fixed with a test that would catch them if they came back.",
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
