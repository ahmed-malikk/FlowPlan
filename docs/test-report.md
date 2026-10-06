# Test Report: FlowPlan v1.0

**Author:** Ahmed Malik · **Test date:** 2026-10-07 · **Plan:** [test-plan.md](test-plan.md) · **Issue:** #12

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
