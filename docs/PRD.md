# PRD: FlowPlan

**Author:** Ahmed Malik · **Date:** 2026-10-06 · **Status:** Shipped (v1.0, 2026-10-07) · **Live:** https://flow-plan-five.vercel.app/

## 1. Problem
Small teams (student groups, 2–5 person startups, freelancers juggling a client project) plan work in WhatsApp threads, sticky notes or a flat to-do list. A flat list doesn't show which tasks are *blocking* others, so when one slips nobody knows whether the deadline is now at risk until it's too late. Heavy tools like MS Project or Jira Advanced Roadmaps solve this but are expensive, slow to learn, and overkill for a 3-week plan.

**Evidence:** <!-- TODO(Ahmed): fill in honestly. e.g. "My own 3-week portfolio plan: 10 projects with dependencies (QueueCare must ship before PulseMetrics can track it). I'm user #1." Add any classmate/FYP-group anecdote only if it really happened. -->

## 2. Target user
A final-year CS student or junior PM in Lahore planning a 2–6 week project with 10–30 tasks, who needs to know "which tasks can I *not* let slip?" without learning a heavy PM tool.

## 3. Goals and non-goals
**Goals:**
- Let a user enter tasks with durations and dependencies in under 5 minutes.
- Instantly show the critical path and how much slack every other task has.
- Refuse impossible plans (circular dependencies) with an error that names the loop.
- Work with no sign-up, no backend; data survives a page refresh.

**Non-goals (out of scope for v1):**
- Accounts, login, multi-user collaboration or sharing.
- Calendar dates, weekends/holidays, working-hours calendars (durations are in whole days from Day 0).
- Resource allocation / people assignment.
- Drag-to-edit on the Gantt chart.
- Import/export to MS Project, Jira or CSV.

## 4. User stories
| # | As a… | I want to… | So that… | Acceptance criteria |
|---|-------|------------|----------|---------------------|
| 1 | planner | add, edit and delete tasks with a name and a duration in days | my plan reflects the real work | Given an empty plan, when I add "Design" with duration 2, then it appears in the task list; when I edit it to 3, the list and chart update; durations must be whole numbers ≥ 1, otherwise an inline error is shown. |
| 2 | planner | mark that a task depends on one or more other tasks | the schedule respects the order work must happen in | Given tasks A and B, when I set B to depend on A, then B's earliest start = A's earliest finish; deleting A removes it from B's dependencies. |
| 3 | planner | be told clearly when my dependencies form a loop | I don't end up with an impossible plan | Given A→B and B→C, when I make A depend on C, then the change is rejected and an error says "Circular dependency: A → B → C → A"; the plan is left unchanged. |
| 4 | planner | see the critical path and the slack of every task | I know which tasks I cannot let slip and how much buffer the others have | Given a valid plan, then each task shows earliest start, latest start and slack; tasks with slack 0 are flagged critical; the total project duration is shown. |
| 5 | planner | see my plan as a Gantt-style timeline with critical tasks highlighted | I can understand the schedule at a glance and screenshot it | Given a valid plan, then each task is a bar starting at its earliest start with length = duration, critical bars use a distinct colour, slack is shown as a faint extension; the chart is readable at 375px width (horizontal scroll inside the chart is OK). |
| 6 | returning planner | have my plan saved automatically in the browser | I don't lose work when I close the tab | Given a plan with tasks, when I refresh the page, then the same tasks and dependencies are restored; a "Load sample plan" button and a "Clear plan" button (with confirm) exist. |

## 5. Success metrics
- **Primary:** I plan my own 3-week, 10-project portfolio in FlowPlan and the critical path it shows matches my hand calculation (screenshot in README = PM proof).
- **Secondary:** A first-time user (classmate) can enter a 6-task plan with dependencies and correctly name the critical path in under 5 minutes without help. Target: 3 of 3 testers.
- **Quality:** Scheduler unit tests pass in CI on every push (cycle detection, critical path, slack, edge cases).
- **How measured:** Manual hallway test with 3 people (record time + success); GitHub Actions status. PulseMetrics can be added in Week 2.

## 6. Solution overview
A single-page Next.js + TypeScript app. All state lives in the browser (localStorage); no server.

**Core algorithm (`src/lib/scheduler.ts`) — the Critical Path Method:**
1. **Graph:** each task is a node; "B depends on A" is an edge A → B.
2. **Topological sort (Kahn's algorithm):** repeatedly take tasks with no unprocessed prerequisites. If tasks are left over that never become free, they're in a cycle → report it.
3. **Forward pass:** in topological order, earliest start (ES) = max earliest finish of its prerequisites (0 if none); EF = ES + duration. Project duration = max EF.
4. **Backward pass:** in reverse order, latest finish (LF) = min latest start of its successors (project duration if none); LS = LF − duration.
5. **Slack** = LS − ES. Slack 0 ⇒ critical.

Why it fits: runs in O(tasks + dependencies), is deterministic and easy to unit test, and is the same method PMs use on paper — so the app's output can be checked by hand.

The algorithm is pure functions with no React imports, so it's tested with Vitest independently of the UI.

## 7. Risks and assumptions
| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Only 2 days to build; scope creep (dates, drag-to-edit) | High | Non-goals list above is fixed; anything new goes to "v1.1 ideas" in the README. |
| Scheduler bugs on edge cases (no tasks, one task, multiple critical paths, disconnected tasks) | Medium | Write tests for each case before wiring the UI. |
| Gantt chart unreadable on phones | Medium | Fixed-width day columns with horizontal scroll inside the chart; test at 375px. |
| localStorage data from an older version breaks the app | Low | Validate on load; on failure, fall back to an empty plan and show a notice. |
| Assumption: durations in whole days are enough for small teams | Medium | Validate with the 3 hallway testers; note feedback in Results. |

## 8. Release plan
- **v0.1 (MVP):** 2026-10-07 — stories 1–6, tests + CI, deployed on Vercel with sample plan.
- **v1.0:** 2026-10-07 — deployed on Vercel; README with live link, screenshots, Mermaid diagrams and the gist; test plan and test report; tagged release. (Screenshot of my real 3-week plan follows in #10.)
- **v1.1:** 2026-10-07 — mark tasks as done (progress only, schedule unchanged), notes on tasks, scrolling dependency lists (#14, #15, #16).
- **Later (ideas, not scheduled):** overload warnings per owner, calendar dates + weekends, export as PNG, share via URL.

## 9. Results (fill after launch)
<!-- Real numbers only. e.g. "Tested with 3 classmates: 3/3 named the critical path; median time 3m40s." -->
**As of 2026-10-07 (v1.0):**
- **Quality (met):** 44 / 44 unit tests pass in CI on every push; the scheduler matches the hand-calculated worked example exactly, plus 3 more projects and 9 edge cases.
- **System tests:** 14 user journeys × 3 environments (desktop Edge, desktop Chrome, 375 px phone): 42 / 42 on the local production build and 42 / 42 on the live site. See [test report](test-report.md).
- **Defects:** testing found 2 phone-only layout bugs (#11, #13); both fixed before release.
- **Primary metric (own 3-week plan): met.** My 3-week portfolio sprint is planned in FlowPlan (#10): 11 items, finish Mon 26 Oct 2026 (day 21), all 11 critical, which matches my hand calculation. Insight: with dependencies alone it would take 12 days; the extra 9 days come from one person doing all the work, which makes per-owner overload warnings the top next feature.
- **Secondary metric (3 hallway testers):** not yet run; protocol in [test plan §8](test-plan.md#8-usability-test-manual).
