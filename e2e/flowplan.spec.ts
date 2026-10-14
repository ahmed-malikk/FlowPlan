import { expect, test as base, type Page } from "@playwright/test";

/**
 * System test cases from docs/test-plan.md. Each test starts with empty browser storage, so tests
 * are independent of each other and of their order. The one-time hints (first-visit tour, slack
 * tip) are marked as already seen, except in the tests that are about them.
 */

const STORAGE_KEY = "flowplan:projects:v1";

const test = base.extend<{ hintsSeen: boolean }>({
  hintsSeen: [true, { option: true }],
  page: async ({ page, hintsSeen }, use) => {
    if (hintsSeen) {
      await page.addInitScript(() => {
        localStorage.setItem("flowplan:seen:tour", "1");
        localStorage.setItem("flowplan:seen:slack-tip", "1");
      });
    }
    await use(page);
  },
});

const isPhone = (page: Page) => (page.viewportSize()?.width ?? 1280) < 521;
const isNarrow = (page: Page) => (page.viewportSize()?.width ?? 1280) < 901;

/** On a phone or tablet Tasks and Diagram are one at a time; on a laptop both are on the page. */
async function showTasks(page: Page) {
  if (isNarrow(page)) await page.getByRole("button", { name: "Tasks", exact: true }).click();
  await expect(page.locator("#tasks-card")).toBeVisible();
}
async function showDiagram(page: Page) {
  if (isNarrow(page)) await page.getByRole("button", { name: "Diagram", exact: true }).click();
  await expect(page.locator("#flow-card")).toBeVisible();
}

async function openExample(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Add the example project" }).click();
  await expect(page.locator("#tasks-card li")).toHaveCount(7);
}

async function createProject(page: Page, name: string) {
  await page.goto("/");
  await page.getByRole("button", { name: /^New( project)?$/ }).first().click();
  await page.getByRole("dialog").getByLabel("Name", { exact: true }).fill(name);
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page.getByRole("heading", { name: "Your route appears here" })).toBeVisible();
}

const quickAdd = (page: Page) => page.locator("#quick-add");

async function addTask(page: Page, name: string, days: string, waitsFor: string[] = []) {
  const form = quickAdd(page);
  await form.getByLabel("Task name").fill(name);
  await form.getByLabel("Days").fill(days);
  if (waitsFor.length) {
    await form.getByRole("button", { name: /^Waits for/ }).click();
    for (const dep of waitsFor) await page.getByRole("group", { name: "Waits for" }).getByRole("checkbox", { name: dep, exact: true }).check();
    await page.keyboard.press("Escape");
  }
  await form.getByRole("button", { name: "Add task" }).click();
}

/** The list row whose task name is exactly `name` (other rows may mention it as a dependency). */
function row(page: Page, name: string) {
  return page.locator("#tasks-card li").filter({ has: page.getByText(name, { exact: true }) });
}

/** The status line: "Finishes <date>. Finishes on day N. X of Y tasks are critical, Z done." */
const status = (page: Page) => page.locator("[role=status]").first();

async function expectNoSideways(page: Page) {
  const { scroll, viewport } = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(scroll, "page must not be wider than the screen").toBeLessThanOrEqual(viewport);
}

/** Opens the edit dialog for a task from its row. */
async function openEdit(page: Page, name: string) {
  await showTasks(page);
  await page.getByRole("button", { name: `Edit ${name}`, exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  return page.getByRole("dialog");
}

/** Saves a project straight into browser storage and opens it (faster than typing many tasks). */
async function seedProject(page: Page, project: object) {
  await page.goto("/");
  await page.evaluate(([key, p]) => localStorage.setItem(key as string, JSON.stringify([p])), [STORAGE_KEY, project]);
  await page.goto(`/project/${(project as { id: string }).id}`);
  await expect(page.locator("#tasks-card")).toBeVisible();
}

test("ST-01 create a project; an empty name is rejected", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /^New( project)?$/ }).first().click();
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page.getByRole("alert")).toHaveText("Give the project a name.");
  await page.getByRole("dialog").getByLabel("Name", { exact: true }).fill("Client website");
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page).toHaveURL(/\/project\//);
  await expect(page.getByLabel("Project name")).toHaveValue("Client website");
});

test("ST-02 empty plan shows an empty state that leads to the add-task bar", async ({ page }) => {
  await createProject(page, "Empty");
  await showDiagram(page);
  await page.getByRole("button", { name: "Add your first task" }).click();
  await expect(page.locator("#add-task-name")).toBeFocused();
  await expect(quickAdd(page).getByRole("button", { name: /^Waits for/ })).toBeDisabled();
});

test("ST-03 a valid task is added; a single task is critical and sets the length", async ({ page }) => {
  await createProject(page, "One task");
  await addTask(page, "Design", "3");
  await showTasks(page);
  await expect(row(page, "Design")).toContainText("critical");
  await expect(status(page)).toContainText("Finishes on day 3");
});

test("ST-04 invalid task input is rejected and nothing is saved", async ({ page }) => {
  await createProject(page, "Validation");
  const form = quickAdd(page);

  await form.getByLabel("Days").fill("2");
  await form.getByRole("button", { name: "Add task" }).click();
  await expect(form.getByRole("alert")).toHaveText("Give the task a name.");

  for (const bad of ["0", "-2", "1.5", "abc"]) {
    await form.getByLabel("Task name").fill("Bad duration");
    await form.getByLabel("Days").fill(bad);
    await form.getByRole("button", { name: "Add task" }).click();
    await expect(form.getByRole("alert"), `duration "${bad}"`).toHaveText("Duration must be a whole number of days, 1 or more.");
  }
  await expect(page.locator("#tasks-card li")).toHaveCount(0);
});

test("ST-05 dependencies set the start day; a task cannot pick itself", async ({ page }) => {
  await createProject(page, "Dependencies");
  await addTask(page, "Backend", "4");
  await addTask(page, "Testing", "2", ["Backend"]);
  await showTasks(page);

  await expect(row(page, "Testing")).toContainText("after Backend"); // starts when Backend finishes
  await expect(status(page)).toContainText("Finishes on day 6");

  const dialog = await openEdit(page, "Testing");
  const options = dialog.getByRole("group", { name: "Waits for" });
  await expect(options.getByRole("checkbox", { name: "Backend", exact: true })).toBeChecked();
  await expect(options.getByRole("checkbox", { name: "Testing", exact: true })).toHaveCount(0);
});

test("ST-06 a circular dependency cannot be picked: the option is off and names the loop", async ({ page }) => {
  await openExample(page);
  const dialog = await openEdit(page, "Requirements");
  const deploy = dialog.getByRole("group", { name: "Waits for" }).getByRole("checkbox", { name: /^Deploy/ });
  await expect(deploy).toBeDisabled();
  const reason = dialog.getByText(/Would create a loop/).first();
  await expect(reason).toBeVisible();
  const text = await dialog.getByRole("group", { name: "Waits for" }).innerText();
  for (const name of ["Requirements", "UI design", "Backend API", "Testing", "Deploy"]) expect(text).toContain(name);

  await dialog.getByRole("button", { name: "Cancel" }).click();
  await showTasks(page);
  await expect(row(page, "Requirements")).toContainText("starts on day 0"); // still waits for nothing
  await expect(status(page)).toContainText("Finishes on day 12");
});

test("ST-07 worked example: 12 days, critical path A-B-C-E-G, slack 1 and 5", async ({ page }) => {
  await openExample(page);
  await expect(status(page)).toContainText("Finishes on day 12. 5 of 7 tasks are critical");
  for (const name of ["Requirements", "UI design", "Backend API", "Testing", "Deploy"]) {
    await expect(row(page, name), name).toContainText("critical");
  }
  await expect(row(page, "Frontend")).toContainText("1d slack");
  await expect(row(page, "User docs")).toContainText("5d slack");
});

test("ST-08 what-if: delaying a critical task moves the finish, using slack does not", async ({ page }) => {
  await openExample(page);
  const more = (name: string) => page.getByRole("button", { name: `One day more for ${name}` });
  const less = (name: string) => page.getByRole("button", { name: `One day less for ${name}` });

  await more("Backend API").click();
  await more("Backend API").click();
  await expect(status(page)).toContainText("Finishes on day 14");

  await less("Backend API").click();
  await less("Backend API").click();
  await expect(status(page)).toContainText("Finishes on day 12");

  await more("Frontend").click(); // uses its 1 day of slack
  await expect(status(page)).toContainText("Finishes on day 12");
  await expect(row(page, "Frontend")).toContainText("critical"); // now has no slack left
});

test("ST-09 the diagram draws every task, the critical path in amber, and the critical strip lists it", async ({ page }) => {
  await openExample(page);
  await showDiagram(page);
  const nodes = page.locator("[data-flow-board] button");
  await expect(nodes).toHaveCount(7);
  await expect(page.locator("[data-flow-board] button[aria-label*=', critical']")).toHaveCount(5);
  await expect(page.locator("[data-flow-board] button[aria-label*='days slack']")).toHaveCount(2); // Frontend and User docs
  await expect(page.getByRole("region", { name: "Flow diagram, scrollable" })).toBeVisible();
  const strip = page.locator("#critical-strip li");
  await expect(strip).toHaveCount(5);
  await expect(strip.first()).toContainText("Requirements");
  await expect(strip.last()).toContainText("Deploy");
});

test("ST-10 deleting a task others wait for removes the dependency, and Undo brings it back", async ({ page }) => {
  await openExample(page);
  const dialog = await openEdit(page, "UI design");
  await dialog.getByRole("button", { name: "Delete task" }).click();

  await expect(page.locator("#tasks-card li")).toHaveCount(6);
  await expect(row(page, "Backend API")).toContainText("starts on day 0"); // no longer waits for UI design

  await page.locator("[data-sonner-toast]").getByRole("button", { name: "Undo" }).click();
  await expect(page.locator("#tasks-card li")).toHaveCount(7);
  await expect(row(page, "Backend API")).toContainText("after UI design");
});

test("ST-11 plans survive a page reload", async ({ page }) => {
  await openExample(page);
  await page.getByRole("button", { name: "One day more for Testing" }).click();
  await page.reload();
  await expect(page.locator("#tasks-card li")).toHaveCount(7);
  await expect(status(page)).toContainText("Finishes on day 13");

  await page.goto("/");
  await expect(page.getByRole("link", { name: "Website launch (example)" })).toBeVisible();
});

test("ST-12 corrupt saved data does not crash the app", async ({ page }) => {
  await page.goto("/");
  await page.evaluate((key) => localStorage.setItem(key, "{not valid json"), STORAGE_KEY);
  await page.reload();
  await expect(page.getByRole("heading", { name: "No plans yet" })).toBeVisible();
  await openExample(page); // and the app still works
});

test("ST-13 deleting a project goes back to the list, and Undo restores it", async ({ page }) => {
  await openExample(page);
  await page.getByRole("button", { name: "Plan menu" }).click();
  await page.getByRole("menuitem", { name: /Delete project/ }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "No plans yet" })).toBeVisible();

  await page.locator("[data-sonner-toast]").getByRole("button", { name: "Undo" }).click();
  await expect(page).toHaveURL(/\/project\//);
  await expect(page.locator("#tasks-card li")).toHaveCount(7);
});

test("ST-14 no page is wider than the screen", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Your plans" })).toBeVisible();
  await expectNoSideways(page);

  await openExample(page);
  await expectNoSideways(page);
  await showDiagram(page);
  await expectNoSideways(page);

  await page.goto("/how-its-built");
  await expect(page.getByRole("heading", { name: "How FlowPlan is built" })).toBeVisible();
  await expectNoSideways(page);
});

test("ST-15 a task with many dependencies keeps a compact row; the picker scrolls", async ({ page }) => {
  const deps = Array.from({ length: 10 }, (_, i) => ({ id: `t${i}`, name: `Project number ${i + 1}`, duration: 1, dependsOn: [] }));
  const last = { id: "last", name: "Portfolio Site", duration: 1, dependsOn: deps.map((d) => d.id) };
  await seedProject(page, { id: "many", name: "Many deps", startDate: "2026-10-07", tasks: [...deps, last] });
  await showTasks(page);

  const lastHeight = (await row(page, "Portfolio Site").boundingBox())!.height;
  expect(lastHeight, "a row with 10 dependencies stays a sensible height").toBeLessThan(330);
  await expect(row(page, "Portfolio Site")).toContainText("Project number 10");

  const dialog = await openEdit(page, "Portfolio Site");
  const box = dialog.getByRole("group", { name: "Waits for" }).locator("xpath=..");
  const { scroll, client } = await box.evaluate((el) => ({ scroll: el.scrollHeight, client: el.clientHeight }));
  expect(scroll, "the list scrolls inside its own box").toBeGreaterThan(client);
});

test("ST-16 marking tasks done shows progress, survives a reload and keeps the schedule", async ({ page }) => {
  await openExample(page);
  await page.getByRole("checkbox", { name: "Mark Requirements as done" }).check();
  await page.getByRole("checkbox", { name: "Mark UI design as done" }).check();

  await expect(status(page)).toContainText("2 done");
  await expect(status(page)).toContainText("Finishes on day 12"); // progress never moves the schedule
  await expect(row(page, "Requirements")).toContainText("critical");

  await page.reload();
  await expect(page.getByRole("checkbox", { name: "Mark Requirements as done" })).toBeChecked();
  await expect(status(page)).toContainText("2 done");

  await page.getByRole("checkbox", { name: "Mark UI design as done" }).uncheck();
  await expect(status(page)).toContainText("1 done");

  await showDiagram(page);
  await expect(page.locator("[data-flow-board] button[aria-label$=', done. Edit']")).toHaveCount(1);
});

test("ST-17 a note can be added, edited, and survives a reload", async ({ page }) => {
  await createProject(page, "Notes");
  await addTask(page, "Backend", "4");
  await showTasks(page);

  let dialog = await openEdit(page, "Backend");
  await dialog.getByLabel("Notes (optional)").fill("Use the API spec from Sara");
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(row(page, "Backend")).toContainText("Use the API spec from Sara");

  dialog = await openEdit(page, "Backend");
  await expect(dialog.getByLabel("Notes (optional)")).toHaveValue("Use the API spec from Sara");
  await dialog.getByLabel("Notes (optional)").fill("Spec approved on Monday");
  await dialog.getByRole("button", { name: "Save" }).click();

  await page.reload();
  await expect(row(page, "Backend")).toContainText("Spec approved on Monday");
});

// ---- New in the redesign ----

test("ST-18 the status line, the critical path note and the plan-complete moment", async ({ page }) => {
  await openExample(page);
  // What-if: lengthen Frontend until it, not Backend API, decides the finish.
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "One day more for Frontend" }).click();
  await expect(page.getByText(/Frontend is now critical|Backend API is no longer critical/).first()).toBeVisible();

  // Tick every task: the plan is complete.
  const boxes = page.getByRole("checkbox", { name: /^Mark .* as done$/ });
  const count = await boxes.count();
  for (let i = 0; i < count; i++) await boxes.nth(i).check();
  await expect(status(page)).toContainText("All 7 tasks are done");
  await expect(page.locator("[data-sonner-toast]").filter({ hasText: "Plan complete" })).toBeVisible();

  await page.getByRole("checkbox", { name: "Mark Deploy as done" }).uncheck();
  await expect(status(page)).toContainText("6 done");
});

test("ST-19 the edit dialog is a real dialog: focus moves in, Escape closes, focus returns", async ({ page }) => {
  await openExample(page);
  await showTasks(page);
  const edit = page.getByRole("button", { name: "Edit UI design", exact: true });
  await edit.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("Task", { exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(edit).toBeFocused();
});

test("ST-20 the edit dialog saves name, days, owner and several waits-for", async ({ page }) => {
  await openExample(page);
  const dialog = await openEdit(page, "User docs");
  await dialog.getByLabel("Task", { exact: true }).fill("Docs v2");
  await dialog.getByLabel("Days").fill("3");
  await dialog.getByLabel("Owner (optional)").fill("Maha");
  await dialog.getByRole("group", { name: "Waits for" }).getByRole("checkbox", { name: "Requirements", exact: true }).check();
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(dialog).toBeHidden();
  await expect(row(page, "Docs v2")).toContainText("Maha");
  await expect(row(page, "Docs v2")).toContainText("Requirements");
  await expect(row(page, "Docs v2")).toContainText("UI design"); // it now waits for both
});

test("ST-21 the Waits for control says it once and lists only task names", async ({ page }) => {
  await openExample(page);
  await quickAdd(page).getByRole("button", { name: /^Waits for/ }).click();
  const options = page.getByRole("group", { name: "Waits for" });
  await expect(options.getByRole("checkbox")).toHaveCount(7);
  const labels = await options.locator("label").allInnerTexts();
  expect(labels.filter((t) => /Waits for/.test(t)), "the words are not repeated in each option").toHaveLength(0);
});

test("ST-22 the header opens New project from any page", async ({ page }) => {
  await openExample(page);
  await page.getByRole("button", { name: /^New( project)?$/ }).first().click();
  await page.getByRole("dialog").getByLabel("Name", { exact: true }).fill("Second plan");
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page.getByLabel("Project name")).toHaveValue("Second plan");
  await page.goto("/");
  await expect(page.locator("article")).toHaveCount(2);
});

test("ST-23 How it's built: personal, complete, no inspiration, with a working explainer", async ({ page }) => {
  await page.goto("/how-its-built");
  await expect(page.getByRole("heading", { name: "Built by Ahmed Malik" })).toBeVisible();
  const text = (await page.locator("main").innerText()).toLowerCase();
  expect(text).not.toMatch(/inspir|mobbin|zaro/);
  for (const h of ["The story", "The problem", "How the critical path is found", "Stack", "Architecture", "Testing", "Links", "Credits"]) {
    await expect(page.getByRole("heading", { name: h })).toBeVisible();
  }
  await expect(page.locator("main a[href^=http]")).toHaveCount(5);

  await page.getByRole("button", { name: "4 Slack" }).click();
  await expect(page.getByText("slack 5 days")).toBeVisible();
  await page.getByRole("button", { name: "2 Forward pass" }).click();
  await expect(page.getByText("finish day 12")).toBeVisible();

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(page.locator("[data-station][data-reached]")).toHaveCount(9);
});

test("ST-24 print: the page keeps the app's look (dark page, header, diagram, timeline) without the screen-only controls", async ({ page }) => {
  await openExample(page);
  await page.emulateMedia({ media: "print" });
  await page.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
  await expect(page.locator("header")).toBeVisible();
  await expect(page.locator("header").getByRole("button", { name: "New project" })).toBeHidden();
  await expect(page.locator("#quick-add")).toBeHidden();
  await expect(page.locator("#tasks-card")).toBeVisible();
  await expect(page.locator("#flow-card")).toBeVisible();
  await expect(page.locator("#flow-card [data-flow-board] button")).toHaveCount(7);
  await expect(page.locator("#critical-strip")).toBeVisible();
  await expect(page.getByRole("img", { name: /^Timeline of 7 tasks over 12 days/ })).toBeVisible();
  // the dark navy page is kept (not a white page), and colours are forced on for the printer
  const look = await page.evaluate(() => ({
    bg: getComputedStyle(document.documentElement).backgroundImage,
    card: getComputedStyle(document.querySelector("#tasks-card")!).backgroundColor,
    adjust: getComputedStyle(document.body).getPropertyValue("print-color-adjust"),
  }));
  expect(look.bg).not.toBe("none");
  expect(look.card).not.toBe("rgb(255, 255, 255)");
  expect(look.adjust).toBe("exact");
});

test("ST-25 the tab bar and the Tasks | Diagram switch exist on a phone only", async ({ page }) => {
  await openExample(page);
  const tabbar = page.getByRole("navigation", { name: "Sections" });
  if (isPhone(page)) {
    await expect(tabbar).toBeVisible();
    await expect(tabbar.getByRole("link", { name: "Plan", exact: true })).toBeVisible();
    await expect(page.locator("#flow-card")).toBeHidden(); // Tasks first
    await page.getByRole("button", { name: "Diagram", exact: true }).click();
    await expect(page.locator("#flow-card")).toBeVisible();
    await expect(page.locator("#tasks-card")).toBeHidden();
    // the critical path is the last thing on the page
    const board = await page.locator("[data-flow-board]").boundingBox();
    const strip = await page.locator("#critical-strip").boundingBox();
    expect(strip!.y).toBeGreaterThan(board!.y + board!.height - 2);
  } else {
    await expect(tabbar).toBeHidden();
    await expect(page.locator("#tasks-card")).toBeVisible();
    await expect(page.locator("#flow-card")).toBeVisible();
  }
});

test("ST-26 on a phone the diagram runs top to bottom and swiping a row marks it done", async ({ page }) => {
  test.skip(!isPhone(page), "phone layout");
  await openExample(page);
  await showDiagram(page);
  const board = page.locator("[data-flow-board]");
  expect(await board.evaluate((el) => el.className)).toContain("flex-none"); // vertical layout
  await expectNoSideways(page);

  await showTasks(page);
  const done = page.getByRole("checkbox", { name: "Mark Backend API as done" });
  await expect(done).not.toBeChecked();
  await page.evaluate(() => {
    const li = [...document.querySelectorAll("#tasks-card li")].find((l) => l.textContent?.startsWith("Backend API"))!;
    const target = li.querySelector("span.font-semibold")!;
    const r = target.getBoundingClientRect();
    const touch = (x: number) => new Touch({ identifier: 1, target, clientX: x, clientY: r.y + 4 });
    const fire = (type: string, x: number, end = false) =>
      target.dispatchEvent(new TouchEvent(type, { bubbles: true, cancelable: true, touches: end ? [] : [touch(x)], changedTouches: [touch(x)] }));
    fire("touchstart", r.x + 10);
    fire("touchmove", r.x + 50);
    fire("touchmove", r.x + 120);
    fire("touchend", r.x + 120, true);
  });
  await expect(done).toBeChecked();
});

test("ST-27 pointing at a task lights what it waits for and what waits for it (desktop)", async ({ page }) => {
  test.skip(isNarrow(page), "hover needs a mouse");
  await openExample(page);
  await page.getByRole("button", { name: /^Backend API, day/ }).hover();
  const dimmed = await page.locator("[data-flow-board] button").evaluateAll((els) => els.filter((e) => e.className.includes("opacity-30")).map((e) => (e as HTMLElement).title));
  expect(dimmed.sort()).toEqual(["Frontend", "User docs"]);
  await page.mouse.move(5, 5);
  await expect(page.locator("[data-flow-board] button.opacity-30")).toHaveCount(0);
});

test("ST-28 tapping a task never leaves the others dimmed", async ({ page }) => {
  await openExample(page);
  await showDiagram(page);
  await page.getByRole("button", { name: /^Frontend, day/ }).click();
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.locator("[data-flow-board] button.opacity-30")).toHaveCount(0);
});

test.describe("first visit", () => {
  test.use({ hintsSeen: false });

  test("ST-29 the tour shows once, is skippable, and does not return after a reload", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Add the example project" }).click();
    const tour = page.getByRole("dialog");
    await expect(tour).toBeVisible({ timeout: 6000 });
    await expect(tour.getByRole("heading")).toHaveText("Add a task");
    await tour.getByRole("button", { name: "Next" }).click();
    await expect(tour.getByRole("heading")).toHaveText("Try what-if");
    await tour.getByRole("button", { name: "Skip tour" }).click();
    await expect(tour).toBeHidden();

    await page.reload();
    await page.waitForTimeout(2600);
    await expect(page.getByRole("dialog")).toHaveCount(0);

    // and it can be replayed from the plan menu
    await page.getByRole("button", { name: "Plan menu" }).click();
    await page.getByRole("menuitem", { name: /Take the tour/ }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
  });

  test("ST-30 the slack tip explains itself once on hover, and on a tap or click any time", async ({ page }) => {
    test.skip(isNarrow(page), "hover needs a mouse");
    await page.addInitScript(() => localStorage.setItem("flowplan:seen:tour", "1")); // this test is about the slack tip only
    await openExample(page);
    const chip = page.locator("#tasks-card button:has-text('slack')").first();
    await chip.hover();
    await expect(page.getByText(/this task can start up to \d+ days? late/)).toBeVisible();
    await page.keyboard.press("Escape");
    await page.mouse.move(5, 5);
    await chip.hover();
    await expect(page.getByText(/this task can start up to/)).toHaveCount(0); // not again by itself
    await chip.click();
    await expect(page.getByText(/this task can start up to/)).toBeVisible();
  });

  test("ST-31 while the tour is open the page is frozen and only the tour box works", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Add the example project" }).click();
    const tour = page.getByRole("dialog");
    await expect(tour).toBeVisible({ timeout: 6000 });
    await expect(tour.getByRole("heading")).toHaveText("Add a task");
    const html = page.locator("html");
    await expect(html).toHaveCSS("overflow", "hidden");

    // the wheel does not move the page, and a click on the dimmed page does nothing
    const y = await page.evaluate(() => window.scrollY);
    await page.mouse.move(200, 400);
    await page.mouse.wheel(0, 700);
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => window.scrollY)).toBe(y);
    await page.mouse.click(8, 400);
    await expect(tour.getByRole("heading")).toHaveText("Add a task");

    // Next moves to the next box; the box is only usable once it has settled
    await tour.getByRole("button", { name: "Next" }).click();
    await expect(tour.getByRole("heading")).toHaveText("Try what-if");
    await tour.getByRole("button", { name: "Next" }).click();
    await expect(tour.getByRole("heading")).toHaveText("Follow the amber path");
    await expect(tour.getByRole("button", { name: "Done" })).toBeVisible();

    // finishing gives the page back
    await tour.getByRole("button", { name: "Done" }).click();
    await expect(tour).toBeHidden();
    await expect(html).not.toHaveCSS("overflow", "hidden");
  });
});
