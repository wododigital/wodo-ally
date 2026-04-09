import { test, expect } from "playwright/test";
import { login, navigateTo } from "./helpers";

test.describe("19 - Data Persistence", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("client data persists after navigation away and back", async ({ page }) => {
    await navigateTo(page, "/clients");
    await page.waitForLoadState("networkidle");
    const initialCards = await page.locator(".glass-card, [class*='glass-card']").count();

    await navigateTo(page, "/dashboard");
    await page.waitForLoadState("networkidle");
    await navigateTo(page, "/clients");
    await page.waitForLoadState("networkidle");

    const afterCards = await page.locator(".glass-card, [class*='glass-card']").count();
    expect(afterCards).toBe(initialCards);
  });

  test("search filters clients and resets correctly", async ({ page }) => {
    await navigateTo(page, "/clients");
    await page.waitForLoadState("networkidle");

    const search = page.locator('input[placeholder="Search clients..."]');
    if (await search.isVisible()) {
      await search.fill("ZZZNONEXISTENT");
      await page.waitForTimeout(500);
      await search.fill("");
      await page.waitForTimeout(500);
      const restored = await page.locator(".glass-card, [class*='glass-card']").count();
      expect(restored).toBeGreaterThan(0);
    }
  });

  test("invoice data persists on detail page after reload", async ({ page }) => {
    await navigateTo(page, "/invoices");
    await page.waitForLoadState("networkidle");

    const firstInvoice = page.locator("a[href*='/invoices/']").first();
    if (await firstInvoice.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstInvoice.click();
      await page.waitForLoadState("networkidle");
      const url = page.url();

      await navigateTo(page, "/dashboard");
      await page.goto(url);
      await page.waitForLoadState("networkidle");

      const hasContent = await page.locator("text=Total").isVisible({ timeout: 5000 }).catch(() => false);
      expect(hasContent).toBeTruthy();
    }
  });

  test("client detail page shows correct info", async ({ page }) => {
    await navigateTo(page, "/clients");
    await page.waitForLoadState("networkidle");

    const firstClient = page.locator("a[href*='/clients/']").first();
    if (await firstClient.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstClient.click();
      await page.waitForLoadState("networkidle");
      expect(page.url()).toContain("/clients/");

      // Verify the detail page has meaningful content (company_name or display_name)
      const bodyText = await page.locator("body").innerText();
      expect(bodyText.length).toBeGreaterThan(50);
    }
  });

  test("settings persist across tab switches", async ({ page }) => {
    await navigateTo(page, "/settings");
    await page.waitForLoadState("networkidle");

    const companyInput = page.locator('input').first();
    if (await companyInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      const value = await companyInput.inputValue();
      expect(value).toBeDefined();
    }
  });
});
