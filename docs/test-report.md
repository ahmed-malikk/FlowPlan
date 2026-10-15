# Test Report: FlowPlan v2.0

**Author:** Ahmed Malik · **Test date:** 2026-10-15 · **Plan:** [test-plan.md](test-plan.md) · **Issue:** #38

## v2.0 run (2026-10-15): the redesign

Final numbers: run on the local production build of `main` on 2026-10-15, after the post-release fixes (#41 to #45), in the same three environments as below: desktop Edge, desktop Chrome and a 375 px phone view. The scheduler's logic and its original tests did not change.

| Level | Cases | Passed | Failed | Skipped |
|---|---|---|---|---|
| Unit (Vitest) | 132 | 132 | 0 | 0 |
| System, 3 environments | 35 × 3 = 105 | 99 | 0 | 6 |

**Unit tests:** 51 from version 1, plus tests for the diagram layout and geometry, the critical-path change note, the status line, short dates, the timeline ticks, the algorithm explainer, the scroll route, one-time hints and navigation, and a test that measures the WCAG contrast of every text and background colour pair.

**System tests:** ST-01 to ST-17 keep their numbers and intent but drive the new screens (the New project dialog, the quick-add bar, the task list, the diagram and the edit dialog). ST-18 to ST-35 are new:

| ID | Test case |
|---|---|
| ST-18 | The status line, the critical path note and the plan-complete moment |
| ST-19 | The edit dialog is a real dialog: focus moves in, Escape closes, focus returns |
| ST-20 | The edit dialog saves name, days, owner and several waits-for |
| ST-21 | The Waits for control says it once and lists only task names |
| ST-22 | The header opens New project from any page |
| ST-23 | How it's built: complete, with a working algorithm explainer |
| ST-24 | Print: a light page with the tasks and the timeline, without the screen-only parts |
| ST-25 | The tab bar and the Tasks / Diagram switch exist on a phone only |
| ST-26 | On a phone the diagram runs top to bottom and swiping a row marks it done |
| ST-27 | Pointing at a task lights what it waits for and what waits for it |
| ST-28 | Tapping a task never leaves the others dimmed |
| ST-29 | The tour shows once, is skippable, and does not return after a reload |
| ST-30 | The slack tip explains itself once on hover, and on a tap or click any time |
| ST-31 | While the tour is open the page is frozen and only the tour box works |
| ST-32 | Resting the pointer on a task's edge does not make the diagram flicker |
| ST-33 | The diagram settles and stays still at 80% browser zoom with classic scrollbars |
| ST-34 | Scrollbars are slim and themed (a gradient thumb), on the page and in scrolling areas |
| ST-35 | Touch screens get a route-thread scroll marker that fades out; mouse screens do not |

**Skipped on purpose (6):** ST-26 is phone-only, so it is skipped in Edge and Chrome on desktop; ST-27, ST-30 and ST-32 need a mouse to hover, and ST-33 needs desktop scrollbars and zoom, so those four are skipped in the phone view.

**Defects found:** 5 (1 by the tests, 4 by using the live site afterwards; none of the last four had a test beforehand, and each now has one).

| ID | Found by | Description | Severity | Fix | Status |
|---|---|---|---|---|---|
| [#40](https://github.com/ahmed-malikk/FlowPlan/issues/40) | Checking the phone layout against the empty-plan screen | On a phone a plan with no tasks hid its empty state and start buttons behind the Tasks / Diagram switch | Medium | `9cd16bd`: the empty state also shows inside the Tasks card on narrow screens | ✅ Fixed, covered by ST-02 |
| [#41](https://github.com/ahmed-malikk/FlowPlan/issues/41) | Using the live site | The page could still be scrolled while the first-visit tour was open, so the highlight drifted off its target | Medium | The page is frozen while the tour is open and steps change with a smooth transition | ✅ Fixed, covered by ST-31 |
| [#42](https://github.com/ahmed-malikk/FlowPlan/issues/42) | Using the live site | Print / PDF came out as a plain white page in the old style | Medium | Print keeps the app's own look: navy page, header, graphics, diagram, tasks and timeline | ✅ Fixed, covered by ST-24 |
| [#43](https://github.com/ahmed-malikk/FlowPlan/issues/43) | Using the live site | Resting the pointer on a task's bottom edge made the task flip between hovered and not hovered | Medium | Hover grows the task instead of lifting it | ✅ Fixed, covered by ST-32 |
| [#44](https://github.com/ahmed-malikk/FlowPlan/issues/44) | Using the live site, on a laptop at about 80% browser zoom | The diagram flickered constantly and the page froze: its drawing came out a fraction of a pixel bigger than its box, which added a scrollbar, which resized the box, in a loop (about 60 resizes a second) | High | The drawing is sized so rounding cannot make it overflow; rows move closer in a short board | ✅ Fixed, covered by ST-33 and a unit test |

**Found while comparing the build with the approved prototype** (before release, so not logged as defects): the flow diagram clipped its last task at a 1440 px window, task rows carried long dates, and a footer repeated the header's links. Fixed in `c35552e`, checked by a new unit test that sizes the diagram for boards 700 to 1000 px wide and by screenshots of the desktop and phone layouts.

**Not covered:** Safari and Firefox; the usability test with first-time users; a manual check on a real phone. The system tests are not run in CI (only typecheck, unit tests and the build are). After the release the same system tests were run against the live site (2026-10-15): **86 passed, 4 skipped by design, 0 failed** in 5.2 minutes, with no test changes.

The sections below are the v1.0 and v1.1 reports, kept as a record.

---


# Test Report: FlowPlan v1.0 and v1.1

**Author:** Ahmed Malik · **Test date:** 2026-10-07 · **Plan:** [test-plan.md](test-plan.md) · **Issue:** #12

## v1.1 regression run (2026-10-07)

Run after adding mark-as-done (#14), notes (#15) and scrolling dependency lists (#16), at commit `68ab2b6`, same environments as below. After deployment the same 51 system tests also passed against the live site (2.5 minutes, 0 failures).

| Level | Cases | Passed | Failed |
|---|---|---|---|
| Unit (Vitest) | 51 (44 + 7 new: UT-10, UT-11) | 51 | 0 |
| System, 3 environments | 17 × 3 = 51 (3 new: ST-15, ST-16, ST-17) | 51 | 0 |

**Found while checking v1.1 with a real 11-task plan** (my 3-week portfolio sprint), before release, so not logged as defects: notes and the done checkbox made the Task column wider, which squeezed Start/Finish until dates wrapped word by word; the table then scrolled sideways at 1280 px; and a scrolling dependency list didn't show that it continued. Fixed in `68ab2b6` (one-line notes, dates kept on one line, wider content area, a "10 tasks · scroll" count) and checked by measuring that the table fits its box at 1280 px and 1366 px.

The sections below are the original v1.0 report.

## 1. Summary

| Level | Cases | Executed | Passed | Failed | Result |
|---|---|---|---|---|---|
| Unit (Vitest) | 44 | 44 | 44 | 0 | ✅ Pass |
| System, desktop Edge (ENV-1) | 14 | 14 | 14 | 0 | ✅ Pass |
| System, desktop Chrome (ENV-2) | 14 | 14 | 14 | 0 | ✅ Pass |
| System, phone 375 px (ENV-3) | 14 | 14 | 14 | 0 | ✅ Pass |
| Usability (3 users) | 1 session × 3 | 0 | – | – | ⏳ Not yet run |

**Defects found during testing:** 2, both Medium severity, both fixed and retested (section 4).

**Exit criteria (test plan §5):** all automated criteria are met. The usability test is outstanding and will be recorded in section 5 and the v1.0 release notes.

## 2. Build and environment under test

| Item | Value |
|---|---|
| Application commit | `1454bf1` (main) |
| Build | Production build: `next build` + `next start` (Next.js 16.4.0, Turbopack) |
| Runtime | Node.js 20.12.2 on Windows 10 Pro |
| Unit test runner | Vitest 3.2.7 |
| System test runner | Playwright 1.63.0 |
| ENV-1 | Microsoft Edge 154.0.4258.53, 1280 × 860 |
| ENV-2 | Google Chrome 154.0.8037.58, 1280 × 860 |
| ENV-3 | Microsoft Edge 154.0.4258.53, 375 × 812, touch enabled |

Commands: `npm test` and `npm run test:e2e`. Every system test starts with empty browser storage.

## 3. Results by test case

### 3.1 Unit tests (ENV-4)

| ID | Area | Cases | Result |
|---|---|---|---|
| UT-01 | Worked example (product guide §6) | 6 | ✅ 6/6 |
| UT-02 | Further hand-calculated projects | 3 | ✅ 3/3 |
| UT-03 | Edge cases | 9 | ✅ 9/9 |
| UT-04 | Topological sort | 2 | ✅ 2/2 |
| UT-05 | Task validation | 10 | ✅ 10/10 |
| UT-06 | Dependencies and loops | 4 | ✅ 4/4 |
| UT-07 | Edits and what-if | 3 | ✅ 3/3 |
| UT-08 | Dates and example project | 4 | ✅ 4/4 |
| UT-09 | Persistence | 3 | ✅ 3/3 |
| | **Total** | **44** | **✅ 44/44** |

### 3.2 System tests

| ID | Test case | ENV-1 Edge | ENV-2 Chrome | ENV-3 Phone |
|---|---|---|---|---|
| ST-01 | Create a project; empty name rejected | ✅ | ✅ | ✅ |
| ST-02 | Empty state leads to the add-task form | ✅ | ✅ | ✅ |
| ST-03 | Valid task added; single task is critical | ✅ | ✅ | ✅ |
| ST-04 | Invalid input rejected, nothing saved | ✅ | ✅ | ✅ |
| ST-05 | Dependencies set start day; no self-dependency | ✅ | ✅ | ✅ |
| ST-06 | Circular dependency blocked and named | ✅ | ✅ | ✅ (after fix #13) |
| ST-07 | Worked example: 12 days, A-B-C-E-G, slack 1 and 5 | ✅ | ✅ | ✅ |
| ST-08 | What-if: critical delay moves finish, slack doesn't | ✅ | ✅ | ✅ |
| ST-09 | Timeline: bars, critical bars, slack | ✅ | ✅ | ✅ |
| ST-10 | Delete a needed task: confirm + dependency removed | ✅ | ✅ | ✅ |
| ST-11 | Plans survive a reload | ✅ | ✅ | ✅ |
| ST-12 | Corrupt storage doesn't crash the app | ✅ | ✅ | ✅ |
| ST-13 | Delete a project | ✅ | ✅ | ✅ |
| ST-14 | No page wider than the screen | ✅ | ✅ | ✅ |
| | **Total** | **14/14** | **14/14** | **14/14** |

Final run: 42 tests in 2.5 minutes, 0 failures, 0 retries.

**Production check.** After deployment, the same 42 tests were run against the live site (`E2E_BASE_URL=https://flow-plan-five.vercel.app npx playwright test`, 2026-10-07): **42 / 42 passed** in 3.0 minutes, with no test changes. The deployed build behaves the same as the tested one.

## 4. Defects

| ID | Found by | Description | Severity | Fix | Status |
|---|---|---|---|---|---|
| [#11](https://github.com/ahmed-malikk/FlowPlan/issues/11) | Manual check at 375 px while preparing screenshots | Project page was 546–680 px wide on phones; cards ran off the screen | Medium | `1f989df`: grid column `minmax(0, 1fr)`; table scroll area `position: relative` so a hidden header label can't escape it | ✅ Fixed, verified by ST-14 |
| [#13](https://github.com/ahmed-malikk/FlowPlan/issues/13) | ST-06 on ENV-3 | On phones the open "Waits for" list covered the Save button; a tap could tick another task by accident | Medium | `1454bf1`: list sits in the page flow below 860 px; list closes on `click` instead of `pointerdown` so the tap reaches Save | ✅ Fixed, verified by ST-05/ST-06 |

**Retest history.** The first full run had 41/42 passing (ST-06 failed on ENV-3, which is defect #13). Fixing only the layout was not enough: the list closed on finger-down, the form shifted up, and the tap missed Save. The second fix resolved it, and the final run passed 42/42.

**Test script corrections (not product defects).** Three scripts were corrected during the first run: ST-01 matched Next.js's own hidden alert region; ST-10 expected "waits for it" when the app correctly says "wait for it" for three dependents; ST-14 matched "No projects yet" as well as "Projects". The app behaved correctly in all three.

## 5. Usability test

Not yet run. Protocol: [test plan §8](test-plan.md#8-usability-test-manual). Fill in after the sessions:

| Participant | Time to enter 6 tasks | All correct? | Named the critical path? | Ease (1–5) | Main confusion |
|---|---|---|---|---|---|
| P1 | | | | | |
| P2 | | | | | |
| P3 | | | | | |

**Target:** 3 of 3 succeed in under 5 minutes.

## 6. Not covered and known limitations

- Safari and Firefox were not tested (planned for v1.1).
- System tests run locally; only unit tests, typecheck and build run in CI on every push.
- The real-phone check (ENV-5) is a manual spot check and is not part of this run.
- No formal accessibility audit. Labels, ARIA tabs and the chart's text alternative are checked indirectly, because the system tests find elements by role and label.

## 7. Conclusion

All 44 unit tests and all 14 system test cases pass on desktop Edge, desktop Chrome and a 375 px phone view. System testing found two Medium layout defects that only appeared on phones; both are fixed and covered by tests that will catch them if they come back. FlowPlan v1.0 meets the automated exit criteria. The usability study remains before the release is fully evidenced.
