# Test Plan: FlowPlan v1.0

**Author:** Ahmed Malik · **Date:** 2026-10-07 · **Version:** 1.0 · **Status:** Approved for execution
**Related:** [PRD](PRD.md) · [Test report](test-report.md) · Issue #12

## 1. Purpose

This plan defines how FlowPlan v1.0 is tested before release: what is tested, how, where, and what counts as "ready to ship". Results are recorded separately in the [test report](test-report.md) so this plan can be reused for later versions.

## 2. Scope

**In scope**

| Area | What is tested |
|---|---|
| Scheduling logic | Topological sort, loop detection and naming, forward/backward pass, slack, critical path (`src/lib/scheduler.ts`) |
| Input handling | Task validation, safe edits and deletes, day → date conversion (`src/lib/plan.ts`) |
| Persistence | Save/load in localStorage, recovery from corrupt data (`src/lib/storage.ts`) |
| User journeys | The 5 MVP user stories, end to end in a real browser |
| Responsive layout | Usable at 375 px (phone) and 1280 px (desktop) |
| Usability | First-time users completing a plan without help |

**Out of scope for v1.0:** performance/load testing beyond the O(V + E) design argument, security testing (no backend or accounts), formal accessibility audit, Safari and Firefox.

## 3. Test levels and approach

| Level | Tool | What it proves | Run with |
|---|---|---|---|
| **Unit** | Vitest | The algorithm and helpers give exactly the hand-calculated answers, including edge cases | `npm test` |
| **System (end-to-end)** | Playwright | A user can complete each story in the real production build, in a real browser | `npm run test:e2e` |
| **Responsive** | Playwright | No page is wider than the screen at 375 px; the table and chart scroll inside their cards | part of `npm run test:e2e` |
| **Usability** | Moderated session (a person) | Real first-time users can do it, and how long it takes | manual, see section 8 |
| **Regression (CI)** | GitHub Actions | Typecheck, unit tests and build pass on every push | automatic |

**Approach.** The scheduling logic is pure functions, so it gets the most thorough coverage at unit level, where tests are fast and precise. System tests then check that the screens wire that logic up correctly, covering each acceptance criterion once. Every test starts from empty browser storage so tests never depend on each other.

## 4. Test environments

| ID | Browser | Screen | Notes |
|---|---|---|---|
| ENV-1 | Microsoft Edge (desktop) | 1280 × 860 | Primary desktop browser |
| ENV-2 | Google Chrome (desktop) | 1280 × 860 | Second engine build, most common browser |
| ENV-3 | Microsoft Edge, phone-sized | 375 × 812, touch | Smallest common phone width (PRD requirement) |
| ENV-4 | Node.js (no browser) | – | Unit tests |
| ENV-5 | Real phone on the same Wi-Fi | device | Manual spot check of the production build |

The system under test is the **production build** (`next build` + `next start`), the same build Vercel serves.

## 5. Entry and exit criteria

**Entry (testing can start when):** the build compiles; typecheck passes; the feature is merged to `main`.

**Exit (ready to release when):**
- 100% of unit tests pass
- 100% of system test cases pass on ENV-1, ENV-2 and ENV-3
- No open defect of severity *High* or *Critical*
- The usability test has been run, or is explicitly recorded as outstanding in the release notes

**Defect severity:** *Critical* = wrong schedule or data loss · *High* = a story cannot be completed · *Medium* = works but broken on one screen size or browser · *Low* = cosmetic.

## 6. Unit test cases

All in `src/lib/scheduler.test.ts` and `src/lib/plan.test.ts` (44 tests).

| ID | Area | Cases | Expected |
|---|---|---|---|
| UT-01 | Worked example (product guide §6) | 6 | Finish day 12; critical A, B, C, E, G; every ES/EF/LS/LF/slack matches the guide's table; Backend +2 → day 14; Frontend +1 → no change |
| UT-02 | Further hand-calculated projects | 3 | House build, a task waiting for two others, a student sprint with parallel work all match hand calculations |
| UT-03 | Edge cases | 9 | No tasks; one task; two independent chains; two equal critical paths; loop A → B → C → A named in order; tasks behind a loop excluded; self-dependency; deleted dependency; duplicate dependency |
| UT-04 | Topological sort | 2 | Every task after its prerequisites; user order kept for unrelated tasks |
| UT-05 | Task validation | 10 | Valid input accepted; empty name and durations "0", "-2", "1.5", "abc", "", "1e2" rejected; id kept when editing |
| UT-06 | Dependencies and loops | 4 | Multiple dependencies saved; self-dependency blocked; a loop is blocked and named; deleted dependencies dropped |
| UT-07 | Edits and what-if | 3 | Delete removes the task from dependents; duration change updates the schedule; never below 1 day |
| UT-08 | Dates and example | 4 | Day → date conversion; 1-day task on day 0; example project equals the worked example |
| UT-09 | Persistence | 3 | Save/load round trip; empty or corrupt storage; malformed tasks dropped |

## 7. System test cases

Automated in `e2e/flowplan.spec.ts`; each runs on ENV-1, ENV-2 and ENV-3.

| ID | Story / edge case | Steps | Expected result |
|---|---|---|---|
| ST-01 | Projects | Click *Create project* with no name; then enter "Client website" and create | Error "Give the project a name."; then the project page opens with that name |
| ST-02 | Edge: no tasks | Open a new project; click *Add your first task* | Empty state is shown; the add-task name field gets focus |
| ST-03 | Story 1 · Edge: one task | Add "Design", 3 days | Task appears, marked Critical; total duration 3 days |
| ST-04 | Story 1 · Edge: bad duration | Submit with empty name; then durations 0, -2, 1.5, abc | Each shows its inline error; no task is saved |
| ST-05 | Story 2 · Edge: self-dependency | Add Backend (4d), Testing (2d) waiting for Backend; edit Testing's dependencies | Testing starts on day 4; total 6 days; Testing is not offered as its own dependency |
| ST-06 | Story 3 · Edge: loop | In the example, make Requirements wait for Deploy and save; cancel | Save blocked; message names all 5 tasks in the loop; plan unchanged (still 12 days) |
| ST-07 | Story 4 · Guide §6 | Open the example project | 12 days; 5 of 7 critical (Requirements, UI design, Backend API, Testing, Deploy); Frontend slack 1 day; User docs slack 5 days |
| ST-08 | Instant what-if | Backend API +2; then −2; then Frontend +1 | 14 days and "+2d"; back to 12; still 12 and Frontend becomes critical |
| ST-09 | Timeline | Open the Timeline tab | 7 bars; 5 critical bars; 2 slack extensions; text alternative names the critical path |
| ST-10 | Edge: delete a needed task | Delete UI design and accept the dialog | Dialog says others wait for it; 6 tasks left; Backend API no longer waits for anything |
| ST-11 | Story 5 | Change a duration; reload; go home | 7 tasks and the changed total (13 days) are still there; project listed on home |
| ST-12 | Edge: corrupt storage | Put invalid JSON in storage; reload | Home shows "No projects yet" without crashing; app still works |
| ST-13 | Projects | Delete the project and accept | Back on home; project gone |
| ST-14 | Responsive (NFR-03) | Measure page width on home, Tasks tab and Timeline tab | Page is never wider than the screen |

## 8. Usability test (manual)

**Goal:** measure PRD success metric *"a first-time user builds a 6-task plan in under 5 minutes without help"*.

**Participants:** 3 people who have not seen FlowPlan (classmates, colleagues or friends).

**Script (say exactly this):**
> "This is a planning tool. Please plan making a short video: write script (1 day), shoot (2 days, after the script), record voice-over (1 day, after the script), edit (2 days, after shooting and voice-over), get feedback (1 day, after editing), publish (1 day, after feedback). Think aloud. I can't help you."

**Measure for each person:**

| Measure | How |
|---|---|
| Time to finish entering all 6 tasks | Stopwatch from first click |
| Success | All 6 tasks and dependencies correct (expected: 7 days; critical path script → shoot → edit → feedback → publish; voice-over has 1 day of slack) |
| Can they name the critical path? | Ask: "Which tasks can't slip?" |
| Confusions | Note every hesitation or wrong click |
| Rating | "How easy was that, 1–5?" |

**Pass:** 3 of 3 succeed in under 5 minutes. Record results in the test report, section 5.

## 9. Traceability

| Requirement | Unit tests | System tests |
|---|---|---|
| Story 1: add tasks with a duration | UT-05 | ST-03, ST-04 |
| Story 2: dependencies | UT-06 | ST-05 |
| Story 3: loop warning | UT-03, UT-06 | ST-06 |
| Story 4: critical path and slack | UT-01–UT-04 | ST-07, ST-08, ST-09 |
| Story 5: saved plans | UT-09 | ST-11, ST-12 |
| Projects (create/delete) | – | ST-01, ST-13 |
| Edge-case table (product guide §9) | UT-03, UT-05, UT-07 | ST-02, ST-04, ST-05, ST-06, ST-10 |
| NFR-03 usable at 375 px | – | ST-14 on ENV-3 |
| NFR-02 usability | – | Section 8 (manual) |

## 10. Roles and schedule

| Activity | Who | When |
|---|---|---|
| Write and maintain this plan | Ahmed Malik | 2026-10-07 |
| Run unit and system tests | Ahmed Malik (automated) | Before every release; unit tests also on every push (CI) |
| Run usability sessions | Ahmed Malik | Before v1.0 release notes are final |
| Record results | Ahmed Malik | [test-report.md](test-report.md) |

## 11. Risks to testing

| Risk | Mitigation |
|---|---|
| System tests depend on visible text and can break when wording changes | Locate elements by role and label where possible; keep wording changes deliberate |
| Only Chromium-based browsers covered | Chrome and Edge cover most users; Safari/Firefox listed for v1.1 |
| System tests not yet in CI | Run `npm run test:e2e` locally before every release; adding them to CI is planned |
