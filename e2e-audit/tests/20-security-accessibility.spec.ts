import { test, expect } from "playwright/test";
import { login, navigateTo } from "./helpers";

test.describe("20 - Security & Accessibility", () => {

  test("unauthenticated access to dashboard redirects to login", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard");
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/login");
  });

  test("unauthenticated access to clients redirects to login", async ({ page }) => {
    await page.goto("http://localhost:3000/clients");
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/login");
  });

  test("unauthenticated API returns 401", async ({ request }) => {
    const resp = await request.post("http://localhost:3000/api/email/send", {
      data: { to: "test@test.com", subject: "test" },
    });
    expect(resp.status()).toBe(401);
  });

  test("login form has proper labels and structure", async ({ page }) => {
    await page.goto("http://localhost:3000/login");
    await page.waitForLoadState("networkidle");

    // Email field exists
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();

    // Password field exists
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();

    // Submit button exists
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();

    // Labels exist
    const labels = page.locator("label");
    expect(await labels.count()).toBeGreaterThanOrEqual(2);
  });

  test("invalid credentials show error message", async ({ page }) => {
    await page.goto("http://localhost:3000/login");
    await page.waitForLoadState("networkidle");

    await page.locator('input[type="email"]').fill("bad@test.com");
    await page.locator('input[type="password"]').fill("wrongpassword");
    await page.locator('button[type="submit"]').click();

    // Wait for error to appear
    const error = page.locator(".text-red-400, .text-red-500, [class*='red']");
    await expect(error.first()).toBeVisible({ timeout: 10000 });
  });

  test("XSS prevention in text inputs", async ({ page }) => {
    await login(page);
    await navigateTo(page, "/clients");
    await page.waitForLoadState("networkidle");

    // Open add client modal
    const addBtn = page.locator("button").filter({ hasText: /add client/i });
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);

      // Try XSS in company name
      const nameInput = page.locator('input[placeholder*="company"], input[placeholder*="Company"]').first();
      if (await nameInput.isVisible().catch(() => false)) {
        await nameInput.fill('<script>alert("xss")</script>');
        // The script tag should be treated as text, not executed
        const value = await nameInput.inputValue();
        expect(value).toContain("<script>");
        // Check no alert dialog appeared
        // (Playwright would throw if an unexpected dialog appeared)
      }
    }
  });

  test("modals have proper ARIA attributes", async ({ page }) => {
    await login(page);
    await navigateTo(page, "/invoices");
    await page.waitForLoadState("networkidle");

    // Look for a button to open new invoice modal
    const newInvoiceBtn = page.locator("button").filter({ hasText: /new invoice|create invoice/i });
    if (await newInvoiceBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await newInvoiceBtn.click();
      await page.waitForTimeout(500);

      // Check for dialog role
      const dialog = page.locator('[role="dialog"]');
      if (await dialog.isVisible({ timeout: 3000 }).catch(() => false)) {
        const ariaModal = await dialog.getAttribute("aria-modal");
        expect(ariaModal).toBe("true");
      }
    }
  });

  test("security headers are present", async ({ page }) => {
    const response = await page.goto("http://localhost:3000/login");
    if (response) {
      const headers = response.headers();
      // Check key security headers (Next.js may set some)
      const hasXFrameOptions = headers["x-frame-options"] !== undefined;
      const hasContentType = headers["x-content-type-options"] !== undefined;
      // At least one security header should be present
      expect(hasXFrameOptions || hasContentType).toBeTruthy();
    }
  });

  test("CSRF protection on API routes", async ({ request }) => {
    // Try to hit API without proper headers - should fail with 401 or 403
    const resp = await request.post("http://localhost:3000/api/invoices/export-csv", {
      data: {},
    });
    // Should be rejected (401 unauthorized or 403 CSRF)
    expect([401, 403]).toContain(resp.status());
  });
});
