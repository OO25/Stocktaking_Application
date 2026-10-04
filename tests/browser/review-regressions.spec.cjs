const { test, expect } = require("@playwright/test");

async function setup(page, { role = "admin", status = "draft" } = {}) {
  const token = `test.${Buffer.from(JSON.stringify({ id: 1, username: "Tester", role, exp: 4102444800, outlet_ids: [1] })).toString("base64")}.test`;
  await page.addInitScript((value) => localStorage.setItem("stocktake_auth_token", value), token);
  const requests = [];
  const session = { id: 1, name: "October count", assignment_name: "October count", outlet_name: "Groove", outlet_id: 1, month: 10, year: 2026, status, total_value: 10 };
  await page.route(/\/api\/(?!.*\.js(?:\?|$))/, async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace("/api", "");
    let data;
    if (request.method() !== "GET") {
      requests.push({ path, method: request.method(), body: request.postDataJSON() });
      if (path.endsWith("/status")) session.status = request.postDataJSON().status;
      if (path.endsWith("/entries")) session.status = request.postDataJSON().finalize ? "submitted" : "in_progress";
      data = { success: true, status: session.status, session };
    } else if (path === "/categories") {
      data = { foodGroups: [{ id: 1, code: "M", name: "Meat", allocated_product_count: 1 }, { id: 2, code: "M2", name: "Meat", allocated_product_count: 0 }, { id: 3, code: "A", name: "apple", allocated_product_count: 0 }], packagingTypes: [] };
    } else if (path === "/uom") {
      data = [{ id: 1, name: "kg", description: "Kilogram", allocated_product_count: 1 }];
    } else if (path === "/outlets") {
      data = [{ id: 1, name: "Groove", cost_centre: "1" }];
    } else if (path === "/suppliers") {
      data = [];
    } else if (path === "/products") {
      data = { rows: [], totalCount: 0 };
    } else if (path === "/stocktake/sessions") {
      data = [session];
    } else if (path === "/stocktake/periods") {
      data = [{ id: 1, month: 10, year: 2026 }];
    } else if (path.endsWith("/detail")) {
      data = { ...session, current_entries: [{ product_id: 1, quantity: 2, unit_price: 5 }], valid_products: [{ product_id: 1, name: "Beef", product_name: "Beef", unit_price: 5, uom_name: "kg" }], temporary_items: [] };
    } else {
      data = [];
    }
    await route.fulfill({ json: data });
  });
  return requests;
}

test("management URLs and navigation are unavailable to managers and viewers", async ({ page }) => {
  for (const role of ["manager", "viewer"]) {
    await setup(page, { role });
    for (const path of ["products", "branches", "categories", "suppliers", "uom", "branch-assignment", "users"]) {
      await page.goto(`/${path}`);
      await expect(page).toHaveURL(/\/branch-dashboard$/);
      await expect(page.getByText("Manage", { exact: true })).toHaveCount(0);
      await expect(page.getByRole("link", { name: "Manage products" })).toHaveCount(0);
    }
  }
});

test("dragging from a modal input onto the backdrop does not dismiss it", async ({ page }) => {
  await setup(page);
  await page.goto("/uom");
  await page.getByRole("button", { name: "Add New Unit" }).click();
  const input = page.getByRole("textbox", { name: "Name *", exact: true });
  await input.fill("Changed unit");
  const box = await input.boundingBox();
  await page.mouse.move(box.x + 100, box.y + 10);
  await page.mouse.down();
  await page.mouse.move(10, 10);
  await page.mouse.up();
  await expect(page.getByRole("heading", { name: "Add New Unit" })).toBeVisible();
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await page.mouse.click(10, 10);
  await expect(page.getByRole("alertdialog")).toBeVisible();
});

test("duplicate units validate before making a write request and in-use deletion stays visible", async ({ page }) => {
  const requests = await setup(page);
  await page.goto("/uom");
  await expect(page).toHaveTitle("Units of Measure | Stocktaking Application");
  await expect(page.getByRole("button", { name: "This is in use and cannot be deleted." })).toBeDisabled();
  await page.getByRole("button", { name: "Add New Unit" }).click();
  await page.getByRole("textbox", { name: "Name *", exact: true }).fill(" KG ");
  await page.getByRole("button", { name: "Add Unit", exact: true }).click();
  await expect(page.getByText("A unit with this name already exists.")).toBeVisible();
  expect(requests).toHaveLength(0);
});

test("category exports download both formats and duplicate names are rejected", async ({ page }) => {
  const requests = await setup(page);
  await page.goto("/categories");
  await expect(page.getByRole("row").nth(1)).toContainText("apple");
  await page.getByRole("combobox", { name: "Sort by name" }).click();
  await page.getByRole("option", { name: "Alphabetical Z–A" }).click();
  await expect(page.getByRole("row").nth(1)).toContainText("Meat");
  for (const [label, extension] of [["CSV", "csv"], ["Excel", "xlsx"]]) {
    await page.getByRole("button", { name: "Options" }).click();
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("menuitem", { name: label, exact: true }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe(`categories.${extension}`);
    expect(await download.failure()).toBeNull();
  }
  await page.getByRole("button", { name: "Add New Category" }).click();
  await page.getByRole("textbox", { name: "Name *", exact: true }).fill(" meat ");
  await page.getByRole("button", { name: "Add Category", exact: true }).click();
  await expect(page.getByText("A category with this name already exists.")).toBeVisible();
  expect(requests).toHaveLength(0);
});

test("duplicate legacy category names remain individually selectable", async ({ page }) => {
  await setup(page);
  await page.goto("/products");
  await page.getByRole("button", { name: /Add New/ }).click();
  await page.locator("form").getByRole("combobox").first().click();
  await page.getByPlaceholder(/Search food/).fill("Meat");
  const choices = page.getByRole("option", { name: "Meat", exact: true });
  await expect(choices).toHaveCount(2);
  await choices.nth(1).hover();
  await expect(page.locator('[cmdk-item][aria-selected="true"]')).toHaveCount(1);
  await choices.nth(1).click();
  await expect(page.locator("form").getByRole("combobox").first()).toHaveText("Meat");
});

test("opening a draft assignment preserves its status until explicitly changed", async ({ page }) => {
  const requests = await setup(page);
  await page.goto("/branch-assignment");
  await page.locator("tbody button").first().click();
  await expect(page.getByRole("combobox").last()).toHaveText("Draft");
  expect(requests).toHaveLength(0);
  await page.getByRole("button", { name: "Save Changes" }).click();
  expect(requests[0].body.status).toBe("draft");
});

test("submitting changed stocktake entries saves and leaves without a discard warning", async ({ page }, testInfo) => {
  const requests = await setup(page);
  await page.goto("/stock-count/1");
  await expect(page).toHaveTitle("October count | Stocktaking Application");
  const quantity = page.locator('input[type="number"]').first();
  await quantity.fill("7");
  await page.screenshot({ path: testInfo.outputPath("stocktake-desktop.png"), fullPage: true });
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await page.getByRole("button", { name: "Yes, Submit", exact: true }).click();
  await expect(page).toHaveURL(/\/stock-count$/);
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  expect(requests.find((request) => request.path.endsWith("/entries")).body.finalize).toBe(true);
});

test("viewers have read-only stocktake controls and no reopen action", async ({ page }) => {
  await setup(page, { role: "viewer" });
  await page.goto("/stock-count/1");
  await expect(page.locator('input[type="number"]').first()).toBeDisabled();
  await expect(page.getByRole("button", { name: "Submit", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Reopen stocktake", exact: true })).toHaveCount(0);
});

test("admins can reopen a submitted stocktake from its detail page", async ({ page }) => {
  const requests = await setup(page, { status: "submitted" });
  await page.goto("/stock-count/1");
  await page.getByRole("button", { name: "Reopen stocktake", exact: true }).click();
  await page.getByRole("button", { name: "Reopen", exact: true }).click();
  await expect(page.getByRole("button", { name: "Submit", exact: true })).toBeVisible();
  expect(requests[0].body.status).toBe("in_progress");
});
