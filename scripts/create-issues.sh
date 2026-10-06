#!/usr/bin/env bash
# Creates the FlowPlan MVP backlog. Run from inside the flowplan repo (Git Bash), after `gh auth login`.
set -e

gh label create mvp   --color 0E8A16 --description "MVP scope"        --force
gh label create setup --color 5319E7 --description "Tooling / infra"  --force
gh label create docs  --color 0075CA --description "Docs / PM work"   --force

gh issue create --label mvp --label setup --title "Scaffold Next.js + TypeScript app with Vitest and GitHub Actions CI" --body "Set up the project skeleton.

**Acceptance criteria**
- [ ] Next.js + TypeScript app runs with \`npm run dev\`
- [ ] Vitest installed; \`npm test\` runs a sample test
- [ ] \`.github/workflows/test.yml\` runs tests on every push
- [ ] \`src/lib/\` folder exists for pure logic (no React imports)"

gh issue create --label mvp --title "Scheduler core: topological sort, forward/backward pass, slack (src/lib/scheduler.ts)" --body "Key file. Pure functions, no UI.

**Acceptance criteria**
- [ ] \`schedule(tasks)\` returns ES, EF, LS, LF, slack, isCritical per task + project duration
- [ ] Cycle detected → returns an error with the loop path, e.g. \`A → B → C → A\`
- [ ] Tests: empty plan, single task, linear chain, diamond (parallel branches), two critical paths, disconnected tasks, cycle
- [ ] Gist walkthrough done and explained back in my own words"

gh issue create --label mvp --title "Story 1: Add, edit and delete tasks with duration" --body "As a planner I want to add, edit and delete tasks with a name and duration in days so that my plan reflects the real work.

**Acceptance criteria**
- Given an empty plan, when I add 'Design' with duration 2, then it appears in the task list
- When I edit it to 3, the list and chart update
- Durations must be whole numbers ≥ 1, otherwise an inline error is shown"

gh issue create --label mvp --title "Story 2: Set task dependencies" --body "As a planner I want to mark that a task depends on other tasks so that the schedule respects the order work must happen in.

**Acceptance criteria**
- Given tasks A and B, when I set B to depend on A, then B's earliest start = A's earliest finish
- Deleting A removes it from B's dependencies"

gh issue create --label mvp --title "Story 3: Clear error for circular dependencies" --body "As a planner I want to be told clearly when my dependencies form a loop so that I don't end up with an impossible plan.

**Acceptance criteria**
- Given A→B and B→C, when I make A depend on C, then the change is rejected
- Error reads 'Circular dependency: A → B → C → A'
- The plan is left unchanged"

gh issue create --label mvp --title "Story 4: Show critical path and slack per task" --body "As a planner I want to see the critical path and the slack of every task so that I know which tasks I cannot let slip.

**Acceptance criteria**
- Each task shows earliest start, latest start and slack
- Tasks with slack 0 are flagged critical
- Total project duration is shown"

gh issue create --label mvp --title "Story 5: Gantt-style timeline with critical tasks highlighted" --body "As a planner I want to see my plan as a timeline so that I understand the schedule at a glance and can screenshot it.

**Acceptance criteria**
- Each task is a bar starting at ES with length = duration
- Critical bars use a distinct colour; slack shown as a faint extension
- Readable at 375px width (horizontal scroll inside the chart is OK)"

gh issue create --label mvp --title "Story 6: Auto-save to localStorage + sample plan + clear" --body "As a returning planner I want my plan saved in the browser so that I don't lose work when I close the tab.

**Acceptance criteria**
- After refresh, the same tasks and dependencies are restored
- Invalid/old saved data falls back to an empty plan with a notice
- 'Load sample plan' button; 'Clear plan' button with confirm"

gh issue create --label docs --title "README, deploy to Vercel, tag v1.0" --body "**Acceptance criteria**
- [ ] README from template: live link, screenshot, problem, features, Mermaid flow diagram, the gist, design decisions, link to docs/PRD.md
- [ ] Deployed on Vercel; live link in README + repo About box
- [ ] Tested at phone width
- [ ] \`git tag v1.0 && git push --tags\` + \`gh release create v1.0\`"

gh issue create --label docs --title "PM proof: plan my real 3-week portfolio sprint in FlowPlan" --body "**Acceptance criteria**
- [ ] All 10 projects entered with real durations and dependencies
- [ ] Critical path checked against a hand calculation
- [ ] Screenshot added to README; result recorded in PRD section 9
- [ ] Hallway test with 3 people (time + success) recorded in PRD section 9"
