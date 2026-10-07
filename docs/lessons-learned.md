# Lessons Learned: FlowPlan

**Author:** Ahmed Malik · **Date:** 2026-10-07 · **Project:** FlowPlan v1.1 (project 1 of my 3-week portfolio) · **Live:** https://flow-plan-five.vercel.app

What building, testing and shipping FlowPlan taught me, and what I'm changing for the next project.

---

## 1. Technologies: what each one did

| Layer | What I used | What I learned |
|---|---|---|
| Language | **TypeScript** (strict) | Types catch mistakes before the app runs; `npm run typecheck` is a free safety net |
| Frontend | **React** components + **Next.js** | Screens are built from reusable pieces (TaskTable, Gantt, SummaryPanel). Next.js turns folders into pages: `app/project/[id]` becomes `/project/123` |
| Styling | Plain **CSS** | Layout bugs only appear at certain screen sizes. `minmax(0, 1fr)`, `position: relative` and scrolling boxes fixed real problems |
| Data | **localStorage**, no backend | A deliberate MVP choice: v1 is single-user, so a server, database or login would add cost and setup with no benefit to the user |
| Hosting | **Vercel** | Connected once to GitHub; every push to `main` is live in about 20 seconds, with older versions kept for rollback |
| Testing | **Vitest** (unit) + **Playwright** (system) | Unit tests check the maths; system tests click through the real app in a browser like a user |
| Automation | **GitHub Actions** | Typecheck, unit tests and build run on every push |
| Analytics | **Vercel Web Analytics** | Anonymous visitor counts, so the README can quote real usage |

**Biggest technology lesson:** FlowPlan is frontend-only. The backend (a real database, sign-in with roles, live updates between screens) is what the next project, QueueCare, adds.

## 2. How good software is structured

- **Keep the logic apart from the screens.** `src/lib/scheduler.ts` contains no React, so it is easy to test, explain and reuse.
- **Pure functions:** same input, same output, no side effects. They make tests short and reliable.
- **Data flows one way:** click → change the data → save → recalculate → redraw.
- **Validate at the door:** bad input and circular dependencies are rejected *before* saving, so stored data is always a valid plan.
- **Algorithms matter:** a graph, a topological sort and two passes turn "will we be late?" into a calculation that runs in O(V + E).

## 3. Testing: what actually happened

- **Unit tests proved the maths, but both real bugs only appeared on phones** ([#11](https://github.com/ahmed-malikk/FlowPlan/issues/11), [#13](https://github.com/ahmed-malikk/FlowPlan/issues/13)). Testing at 375 px found them.
- **The first fix isn't always the fix.** The dropdown bug needed a second change; re-running the test is what showed it.
- **A failing test can be the test's fault.** Three early failures were mistakes in my test scripts, not the app. Read the error before changing code.
- **Test the live site too.** The same 51 system tests passed against the deployed site, so what users get is what I tested.
- **Use the product for real.** Loading my own 11-task plan exposed layout problems that small examples never showed.

**Final numbers (v1.1):** 51 / 51 unit tests; 17 system tests × 3 environments = 51 / 51, locally and on the live site. Details: [test plan](test-plan.md) · [test report](test-report.md).

## 4. Git and GitHub

| Practice | What I did |
|---|---|
| Small commits | One per feature, named `feat:` / `fix:` / `test:` / `docs:` |
| Issues | 16 issues with acceptance criteria, each closed with a note or a `Closes #n` commit |
| Labels | `mvp`, `bug`, `docs`, `test`, `setup` |
| Releases | v1.0 and v1.1, tagged, with release notes |
| README and About box | The repo's shop window: live link, screenshots, design decisions, real results |
| History | Rewriting published commits changes every commit ID and needs a careful force-push: possible, but best avoided by getting commits right the first time |
| Identity | Check that every repo commits under my own name before the first commit |
| Two repos | One for the product (FlowPlan), one for the programme ([portfolio-progress](https://github.com/ahmed-malikk/portfolio-progress)) |

## 5. Running and deploying

- **Dev vs production:** `npm run dev` is for editing; `npm run build` + `npm start` is what users get, and it's also what works when testing from a phone on the same Wi-Fi.
- **Don't build while the dev server is running:** they share the `.next` folder, and a corrupted dev server made pages take 25 seconds.
- **Servers keep running until stopped** (Ctrl + C). Forgotten servers cause confusing problems later.
- **Warnings aren't errors.** Install-script warnings were harmless; what matters is `ERR!` or a deployment marked Error.

## 6. How teams work

| Practice | What I produced |
|---|---|
| Plan before building | [PRD](PRD.md): problem, users, goals, non-goals, user stories with acceptance criteria |
| Fixed scope | 5 MVP features; everything else on a written out-of-scope list |
| Work in tickets | A backlog of issues, closed when done, so progress can be counted |
| Definition of done | Code + tests + docs + deployed, not just "works on my laptop" |
| Quality gates | Automated checks on every push, a test plan and a test report |
| Bug process | Find → log an issue → fix → `Closes #n` commit → retest |
| Releases | Versioned, with notes on what changed and known limits |
| Honest reporting | Real numbers only; pending items marked pending; slips written down |

## 7. Product and project management

- **Plan vs actual:** I committed the features in one batch at the end instead of one by one, and published the issues after the build. Both are recorded as process slips.
- **Planning my own sprint gave a real insight.** Planned with dependencies alone, my 3-week portfolio takes **12 days**; as one person it takes **21 days**, with **all 11 items critical**. The Critical Path Method assumes unlimited people, so my real constraint is me: any slip moves the final date, my single buffer day matters, and per-person overload warnings are the most useful next feature.
- **Decide with evidence:** a redesign and sign-in were deferred because no user evidence asked for them yet. The 3-person usability study is how I'll get that evidence.

## 8. What I'm changing for the next project (QueueCare)

1. Set up tooling and the issue board **before day 1**, then commit and push **after every feature**.
2. Write the PRD and BRD first, and turn user stories into issues straight away.
3. Test at **phone width from the first screen**, not at the end.
4. Explain each key file back in my own words **as it's written**, not once at the end.
5. Take the new backend skills (database design, roles, real-time updates) step by step.
6. Arrange real users early: a receptionist and patients for the BA interviews.

## Still open on FlowPlan

- Usability study with 3 first-time users ([test plan §8](test-plan.md#8-usability-test-manual))
- Print layout polish
- A visual GitHub Project board
