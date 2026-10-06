# FlowPlan

A lightweight project scheduler that shows which tasks hold up the whole project.

Small teams miss deadlines because nobody can see which tasks block everything else. FlowPlan takes your tasks, their durations and their dependencies, then calculates the **critical path** and the **slack** for every task, so you know exactly what you can't let slip.

> Status: in development. Live demo coming soon.

## Planned features (MVP)

- Add and edit tasks with a duration and dependencies
- Detect circular dependencies with a clear error (e.g. `A → B → C → A`)
- Calculate the critical path and slack per task
- Gantt-style timeline with critical tasks highlighted
- Auto-save in the browser (no sign-up)

## Tech stack

Next.js · TypeScript · Vitest · GitHub Actions · Vercel

## Docs

- [Product Requirements Document](docs/PRD.md)
