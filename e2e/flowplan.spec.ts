import { expect, test, type Page } from "@playwright/test";

/**
 * System test cases from docs/test-plan.md. Each test starts with empty browser
 * storage, so tests are independent of each other and of their order.
 */

const STORAGE_KEY = "flowplan:projects:v1";

async function openExample(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Open the example project" }).click();
  await expect(page.locator("table.tasks")).toBeVisible();
}

async function createProject(page: Page, name: string) {
  await page.goto("/");
  await page.getByLabel("Name").fill(name);
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page.getByRole("heading", { name: "No tasks yet" })).toBeVisible();
}

/** The add-task form at the bottom of the Tasks tab (not an inline edit form). */
function addForm(page: Page) {
  return page.locator("form.task-form").filter({ has: page.locator("#add-task-name") });
}

async function addTask(page: Page, name: string, days: string, waitsFor: string[] = []) {
  const form = addForm(page);
  await form.getByLabel("Task").fill(name);
  await form.getByLabel("Days").fill(days);
  if (waitsFor.length) {
    await form.locator("details.picker summary").click();
    for (const dep of waitsFor) await form.locator("label.picker-option", { hasText: dep }).locator("input").check();
    await form.locator("details.picker summary").click();
  }
  await form.getByRole("button", { name: "Add task" }).click();
}

/** The table row whose task name is exactly `name` (other rows may mention it as a dependency). */
function row(page: Page, name: string) {
  return page
    .locator("table.tasks tbody tr")
    .filter({ has: page.locator(".task-name").getByText(name, { exact: true }) });
}

const summary = (page: Page) => page.locator(".summary");

async function expectNoSideways(page: Page) {
  const { scroll, viewport } = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(scroll, "page must not be wider than the screen").toBeLessThanOrEqual(viewport);
}

test("ST-01 create a project; an empty name is rejected", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page.locator("form .field-error")).toHaveText("Give the project a name.");

  await createProject(page, "Client website");
  await expect(page).toHaveURL(/\/project\//);
  await expect(page.getByLabel("Project name")).toHaveValue("Client website");
});

test("ST-02 empty project shows an empty state that leads to the add-task form", async ({ page }) => {
  await createProject(page, "Empty");
  await page.getByRole("button", { name: "Add your first task" }).click();
  await expect(page.locator("#add-task-name")).toBeFocused();
});

test("ST-03 a valid task is added; a single task is critical and sets the length", async ({ page }) => {
  await createProject(page, "One task");
  await addTask(page, "Design", "3");
  await expect(row(page, "Design")).toHaveClass(/is-critical/);
  await expect(row(page, "Design")).toContainText("Critical");
  await expect(summary(page)).toContainText("3 days");
});

test("ST-04 invalid task input is rejected and nothing is saved", async ({ page }) => {
  await createProject(page, "Validation");
  const form = addForm(page);

  await form.getByLabel("Days").fill("2");
  await form.getByRole("button", { name: "Add task" }).click();
  await expect(form).toContainText("Give the task a name.");

  for (const bad of ["0", "-2", "1.5", "abc"]) {
    await form.getByLabel("Task").fill("Bad duration");
    await form.getByLabel("Days").fill(bad);
    await form.getByRole("button", { name: "Add task" }).click();
    await expect(form, `duration "${bad}"`).toContainText("Duration must be a whole number of days, 1 or more.");
  }
  await expect(page.locator("table.tasks")).toHaveCount(0);
});

test("ST-05 dependencies set the start day; a task cannot pick itself", async ({ page }) => {
  await createProject(page, "Dependencies");
  await addTask(page, "Backend", "4");
  await addTask(page, "Testing", "2", ["Backend"]);

  await expect(row(page, "Testing")).toContainText("day 4"); // starts when Backend finishes
  await expect(summary(page)).toContainText("6 days");

  await row(page, "Testing").getByRole("button", { name: "Edit" }).click();
  const editRow = page.locator("tr.editing-row");
  await editRow.locator("details.picker summary").click();
  await expect(editRow.locator("label.picker-option", { hasText: "Backend" })).toHaveCount(1);
  await expect(editRow.locator("label.picker-option", { hasText: "Testing" })).toHaveCount(0);
});

test("ST-06 a circular dependency is blocked, named, and the plan is unchanged", async ({ page }) => {
  await openExample(page);
  await row(page, "Requirements").getByRole("button", { name: "Edit" }).click();
  const editRow = page.locator("tr.editing-row");
  await editRow.locator("details.picker summary").click();
  await editRow.locator("label.picker-option", { hasText: "Deploy" }).locator("input").check();
  await editRow.getByRole("button", { name: "Save" }).click();

  const error = editRow.getByRole("alert");
  await expect(error).toContainText("This would create a loop");
  for (const name of ["Requirements", "UI design", "Backend API", "Testing", "Deploy"]) {
    await expect(error).toContainText(name);
  }
  await editRow.getByRole("button", { name: "Cancel" }).click();
  await expect(row(page, "Requirements")).toContainText("—"); // still waits for nothing
  await expect(summary(page)).toContainText("12 days");
});

test("ST-07 worked example: 12 days, critical path A-B-C-E-G, slack 1 and 5", async ({ page }) => {
  await openExample(page);
  await expect(summary(page)).toContainText("12 days");
  await expect(summary(page)).toContainText("5 of 7");
  for (const name of ["Requirements", "UI design", "Backend API", "Testing", "Deploy"]) {
    await expect(row(page, name), name).toHaveClass(/is-critical/);
  }
  await expect(row(page, "Frontend")).toContainText("1 day");
  await expect(row(page, "User docs")).toContainText("5 days");
});

test("ST-08 what-if: delaying a critical task moves the finish, using slack does not", async ({ page }) => {
  await openExample(page);
  const more = (name: string) => page.getByRole("button", { name: `One day more for ${name}` });
  const less = (name: string) => page.getByRole("button", { name: `One day less for ${name}` });

  await more("Backend API").click();
  await more("Backend API").click();
  await expect(summary(page)).toContainText("14 days");
  await expect(summary(page)).toContainText("+2d");

  await less("Backend API").click();
  await less("Backend API").click();
  await expect(summary(page)).toContainText("12 days");

  await more("Frontend").click(); // uses its 1 day of slack
  await expect(summary(page)).toContainText("12 days");
  await expect(row(page, "Frontend")).toHaveClass(/is-critical/); // now has no slack left
});

test("ST-09 timeline draws every task, critical bars and slack", async ({ page }) => {
  await openExample(page);
  await page.getByRole("tab", { name: "Timeline" }).click();
  await expect(page.locator(".gantt-bar")).toHaveCount(7);
  await expect(page.locator(".gantt-bar.is-critical")).toHaveCount(5);
  await expect(page.locator(".gantt-slack")).toHaveCount(2); // Frontend and User docs
  await expect(page.getByRole("img", { name: /Critical path: Requirements, UI design, Backend API, Testing, Deploy/ })).toBeVisible();
});

test("ST-10 deleting a task others wait for asks first and removes the dependency", async ({ page }) => {
  await openExample(page);
  let message = "";
  page.once("dialog", (d) => {
    message = d.message();
    void d.accept();
  });
  await row(page, "UI design").getByRole("button", { name: "Delete" }).click();

  expect(message).toMatch(/"Backend API", "Frontend", "User docs" wait for it/);
  await expect(page.locator("table.tasks tbody tr")).toHaveCount(6);
  await expect(row(page, "Backend API")).toContainText("—"); // no longer waits for UI design
});

test("ST-11 plans survive a page reload", async ({ page }) => {
  await openExample(page);
  await page.getByRole("button", { name: "One day more for Testing" }).click();
  await page.reload();
  await expect(page.locator("table.tasks tbody tr")).toHaveCount(7);
  await expect(summary(page)).toContainText("13 days");

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Website launch (example)" })).toBeVisible();
});

test("ST-12 corrupt saved data does not crash the app", async ({ page }) => {
  await page.goto("/");
  await page.evaluate((key) => localStorage.setItem(key, "{not valid json"), STORAGE_KEY);
  await page.reload();
  await expect(page.getByRole("heading", { name: "No projects yet" })).toBeVisible();
  await openExample(page); // and the app still works
});

test("ST-13 deleting a project asks first and removes it", async ({ page }) => {
  await openExample(page);
  page.once("dialog", (d) => void d.accept());
  await page.getByRole("button", { name: "Delete project" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "No projects yet" })).toBeVisible();
});

test("ST-14 no page is wider than the screen", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Projects", exact: true })).toBeVisible();
  await expectNoSideways(page);

  await openExample(page);
  await expectNoSideways(page);
  await page.getByRole("tab", { name: "Timeline" }).click();
  await expect(page.locator(".gantt")).toBeVisible();
  await expectNoSideways(page);
});

/** Saves a project straight into browser storage and opens it (faster than typing many tasks). */
async function seedProject(page: Page, project: object) {
  await page.goto("/");
  await page.evaluate(([key, p]) => localStorage.setItem(key as string, JSON.stringify([p])), [STORAGE_KEY, project]);
  await page.goto(`/project/${(project as { id: string }).id}`);
  await expect(page.locator("table.tasks")).toBeVisible();
}

test("ST-15 a task with many dependencies keeps a compact row; the list scrolls", async ({ page }) => {
  const deps = Array.from({ length: 10 }, (_, i) => ({ id: `t${i}`, name: `Project number ${i + 1}`, duration: 1, dependsOn: [] }));
  const last = { id: "last", name: "Portfolio Site", duration: 1, dependsOn: deps.map((d) => d.id) };
  await seedProject(page, { id: "many", name: "Many deps", startDate: "2026-10-07", tasks: [...deps, last] });

  const lastRow = row(page, "Portfolio Site");
  const firstRow = row(page, "Project number 1");
  const lastHeight = (await lastRow.boundingBox())!.height;
  const firstHeight = (await firstRow.boundingBox())!.height;
  expect(lastHeight, "row with 10 dependencies stays close to a normal row").toBeLessThan(firstHeight + 30);

  const list = lastRow.locator(".chips-scroll");
  await expect(list.locator(".chip")).toHaveCount(10);
  const { scroll, client } = await list.evaluate((el) => ({ scroll: el.scrollHeight, client: el.clientHeight }));
  expect(scroll, "the list scrolls inside its own box").toBeGreaterThan(client);
});

test("ST-16 marking tasks done shows progress, survives a reload and keeps the schedule", async ({ page }) => {
  await openExample(page);
  await page.getByRole("checkbox", { name: "Mark Requirements as done" }).check();
  await page.getByRole("checkbox", { name: "Mark UI design as done" }).check();

  await expect(row(page, "Requirements")).toHaveClass(/is-done/);
  await expect(summary(page)).toContainText("2 of 7 done");
  await expect(summary(page)).toContainText("12 days"); // progress never moves the schedule
  await expect(row(page, "Requirements")).toHaveClass(/is-critical/);

  await page.reload();
  await expect(page.getByRole("checkbox", { name: "Mark Requirements as done" })).toBeChecked();
  await expect(summary(page)).toContainText("2 of 7 done");

  await page.getByRole("checkbox", { name: "Mark UI design as done" }).uncheck();
  await expect(summary(page)).toContainText("1 of 7 done");

  await page.getByRole("tab", { name: "Timeline" }).click();
  await expect(page.locator(".gantt-bar.is-done")).toHaveCount(1);
});

test("ST-17 a note can be added, edited, and survives a reload", async ({ page }) => {
  await createProject(page, "Notes");
  const form = addForm(page);
  await form.getByLabel("Task").fill("Backend");
  await form.getByLabel("Days").fill("4");
  await form.getByLabel("Notes (optional)").fill("Use the API spec from Sara");
  await form.getByRole("button", { name: "Add task" }).click();
  await expect(row(page, "Backend").locator(".task-note")).toHaveText("Use the API spec from Sara");

  await row(page, "Backend").getByRole("button", { name: "Edit" }).click();
  const editRow = page.locator("tr.editing-row");
  await expect(editRow.getByLabel("Notes (optional)")).toHaveValue("Use the API spec from Sara");
  await editRow.getByLabel("Notes (optional)").fill("Spec approved on Monday");
  await editRow.getByRole("button", { name: "Save" }).click();

  await page.reload();
  await expect(row(page, "Backend").locator(".task-note")).toHaveText("Spec approved on Monday");
});
