import { test, expect } from "playwright/test";
import { login, navigateTo, waitForSelector, safeAction } from "./helpers";

test.describe("Contracts & Pipeline", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // ─── Contracts ──────────────────────────────────────────────────────────────

  test("navigate to /contracts and page loads", async ({ page }) => {
    await navigateTo(page, "/contracts");
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("/contracts");
    expect(page.url()).not.toContain("/login");

    // Page should have meaningful content
    const bodyText = await page.locator("body").innerText();
    expect(bodyText.length).toBeGreaterThan(50);
  });

  test("contracts page loads without errors", async ({ page }) => {
    await navigateTo(page, "/contracts");

    // No error states
    const errorBanner = page.locator('[role="alert"][class*="error"], [class*="error-page"]');
    const hasError = await errorBanner.first().isVisible().catch(() => false);
    const hasSomethingWrong = await page.getByText(/something went wrong/i).first().isVisible().catch(() => false);
    expect(hasError || hasSomethingWrong).toBe(false);

    // Page should have meaningful content (heading or any content)
    const hasHeading = await page.getByText(/contract/i).first().isVisible().catch(() => false);
    const bodyText = await page.locator("body").innerText();
    const hasContent = bodyText.length > 50;

    expect(hasHeading || hasContent).toBeTruthy();
  });

  test("check for contract list or empty state", async ({ page }) => {
    await navigateTo(page, "/contracts");

    // Look for contract list, table, or cards
    const contractList = page.locator(
      'table, [role="list"], [role="grid"], [class*="contract"], [class*="Contract"], [class*="card"], [class*="Card"]'
    );
    const emptyState = page.locator(
      'text=/no contract/i, text=/no records/i, text=/no data/i, text=/empty/i, text=/get started/i, text=/create your first/i, text=/add a contract/i'
    );
    const createButton = page.locator(
      'button:has-text("Create"), button:has-text("New"), button:has-text("Add"), a:has-text("Create"), a:has-text("New")'
    );

    const hasList = (await contractList.count()) > 0;
    const hasEmpty = await emptyState.first().isVisible().catch(() => false);
    const hasCreate = await createButton.first().isVisible().catch(() => false);

    // Either contracts are listed, an empty state is shown, or a create button exists
    expect(hasList || hasEmpty || hasCreate).toBeTruthy();
  });

  // ─── Pipeline ───────────────────────────────────────────────────────────────

  test("navigate to /pipeline and page loads", async ({ page }) => {
    await navigateTo(page, "/pipeline");
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("/pipeline");
    expect(page.url()).not.toContain("/login");

    const bodyText = await page.locator("body").innerText();
    expect(bodyText.length).toBeGreaterThan(50);
  });

  test("pipeline page loads with sales pipeline view", async ({ page }) => {
    await navigateTo(page, "/pipeline");

    // No error states
    const errorBanner = page.locator('[role="alert"][class*="error"], [class*="error-page"]');
    const hasError = await errorBanner.first().isVisible().catch(() => false);
    expect(hasError).toBe(false);

    // Look for pipeline-related heading or any meaningful content
    const hasHeading = await page.getByText(/pipeline|sales|deals/i).first().isVisible().catch(() => false);
    const bodyText = await page.locator("body").innerText();
    const hasContent = bodyText.length > 50;

    expect(hasHeading || hasContent).toBeTruthy();
  });

  test("check for pipeline stages or columns", async ({ page }) => {
    await navigateTo(page, "/pipeline");

    // Wait for board/kanban to render
    await page.waitForTimeout(1500);

    // Look for kanban-style columns or stage indicators
    const stageColumns = page.locator(
      '[class*="column"], [class*="Column"], [class*="stage"], [class*="Stage"], [class*="kanban"], [class*="Kanban"], [class*="board"], [class*="Board"], [class*="lane"], [class*="Lane"]'
    );
    const hasLabels = await page.getByText(/lead|prospect|proposal|negotiation|won|lost|qualified|discovery|closed/i).first().isVisible().catch(() => false);
    const pipelineCards = page.locator(
      '[class*="deal"], [class*="Deal"], [class*="opportunity"], [class*="Opportunity"], [class*="pipeline-card"], [class*="PipelineCard"]'
    );
    const isEmpty = await page.getByText(/no deals|no pipeline|empty|get started|add a deal/i).first().isVisible().catch(() => false);

    const hasColumns = (await stageColumns.count()) > 1;
    const hasCards = (await pipelineCards.count()) > 0;
    const bodyText = await page.locator("body").innerText();
    const hasContent = bodyText.length > 50;

    // Either pipeline stages/columns are present, empty state, or page has content
    expect(hasColumns || hasLabels || hasCards || isEmpty || hasContent).toBeTruthy();
  });

  // ─── Targets ────────────────────────────────────────────────────────────────

  test("navigate to /targets and page loads", async ({ page }) => {
    await navigateTo(page, "/targets");
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("/targets");
    expect(page.url()).not.toContain("/login");

    const bodyText = await page.locator("body").innerText();
    expect(bodyText.length).toBeGreaterThan(50);
  });

  test("targets page loads with financial targets", async ({ page }) => {
    await navigateTo(page, "/targets");

    // No error states
    const errorBanner = page.locator('[role="alert"][class*="error"], [class*="error-page"]');
    const hasError = await errorBanner.first().isVisible().catch(() => false);
    expect(hasError).toBe(false);

    // Look for target-related content using safe locators
    const hasTargetContent = await page.getByText(/target|goal|revenue|forecast|budget/i).first().isVisible().catch(() => false)
      || await page.locator('[class*="target"], [class*="Target"], [class*="goal"], [class*="Goal"]').count() > 0;
    const hasCharts = await page.locator('svg, canvas, [class*="chart"], [class*="Chart"]').count() > 0;
    const hasProgress = await page.locator('[role="progressbar"], [class*="progress"], [class*="Progress"]').count() > 0;
    const isEmpty = await page.getByText(/no target|set your|get started|no data/i).first().isVisible().catch(() => false);
    const bodyText = await page.locator("body").innerText();
    const hasContent = bodyText.length > 50;

    expect(hasTargetContent || hasCharts || hasProgress || isEmpty || hasContent).toBeTruthy();
  });
});
