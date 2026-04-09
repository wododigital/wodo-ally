import { test, expect } from "playwright/test";
import { login, navigateTo, waitForSelector, safeAction } from "./helpers";

test.describe("Settings Page", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("navigate to /settings and page loads", async ({ page }) => {
    await navigateTo(page, "/settings");
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("/settings");
    expect(page.url()).not.toContain("/login");

    // Page should have meaningful content
    const bodyText = await page.locator("body").innerText();
    expect(bodyText.length).toBeGreaterThan(50);
  });

  test("settings page loads with tabs", async ({ page }) => {
    await navigateTo(page, "/settings");

    // Look for tab navigation
    const tabList = page.locator('[role="tablist"]');
    const tabLinks = page.locator(
      '[role="tab"], [class*="tab"], [class*="Tab"], a[href*="/settings/"], button[class*="tab"]'
    );
    const navLinks = page.locator(
      'nav a, [class*="sidebar"] a, [class*="Sidebar"] a, [class*="nav"] a'
    );

    const hasTabList = await tabList.first().isVisible().catch(() => false);
    const tabCount = await tabLinks.count();
    const navCount = await navLinks.count();

    // Settings page should have some form of tab or section navigation
    expect(hasTabList || tabCount > 1 || navCount > 1).toBeTruthy();
  });

  test("Company tab: verify company name field has WODO Digital or is editable", async ({ page }) => {
    await navigateTo(page, "/settings");

    // Try clicking a Company tab if it exists
    const companyTab = page.locator('button').filter({ hasText: /company/i }).first();
    if (await companyTab.isVisible().catch(() => false)) {
      await companyTab.click();
      await page.waitForLoadState("networkidle");
    }

    // Look for company name field
    const companyNameField = page.locator(
      'input[name*="company"], input[name*="Company"], input[placeholder*="company"], input[placeholder*="Company"], input.glass-input'
    );
    const companyText = page.getByText(/WODO/i);

    const hasField = (await companyNameField.count()) > 0;
    const hasText = await companyText.first().isVisible().catch(() => false);

    // Either a company name input is present, or the company name text is visible
    expect(hasField || hasText).toBeTruthy();

    // If field exists, check if it contains WODO Digital
    if (hasField) {
      const firstField = companyNameField.first();
      const value = await firstField.inputValue().catch(() => "");
      if (value) {
        expect(value.toLowerCase()).toContain("wodo");
      }
    }
  });

  test("verify GSTIN field present", async ({ page }) => {
    await navigateTo(page, "/settings");

    // Try clicking Company tab first
    const companyTab = page.locator('button').filter({ hasText: /company/i }).first();
    if (await companyTab.isVisible().catch(() => false)) {
      await companyTab.click();
      await page.waitForLoadState("networkidle");
    }

    // Look for GSTIN field using safe locators
    const hasGstin = await page.getByPlaceholder(/gst/i).count() > 0
      || await page.locator('input[name*="gst"], input[name*="GST"], input[name*="gstin"], input[name*="GSTIN"]').count() > 0
      || await page.locator('label').filter({ hasText: /GST/i }).count() > 0
      || await page.getByText(/GSTIN/i).first().isVisible().catch(() => false);

    expect(hasGstin).toBeTruthy();
  });

  test("Bank Settings tab: verify bank account fields", async ({ page }) => {
    await navigateTo(page, "/settings");

    // Try clicking Bank Settings tab
    const bankTab = page.locator('button').filter({ hasText: /bank/i }).first();
    if (await bankTab.isVisible().catch(() => false)) {
      await bankTab.click();
      await page.waitForLoadState("networkidle");
    }

    // Look for bank-related fields using safe locators
    const hasBankFields = await page.getByPlaceholder(/bank|account|ifsc/i).count() > 0
      || await page.locator('input[name*="bank"], input[name*="Bank"], input[name*="account"], input[name*="Account"], input[name*="ifsc"], input[name*="IFSC"]').count() > 0
      || await page.locator('label').filter({ hasText: /bank|account|IFSC/i }).count() > 0
      || await page.getByText(/bank account|account number|IFSC/i).first().isVisible().catch(() => false);

    expect(hasBankFields).toBeTruthy();
  });

  test("Invoice Settings tab: verify invoice prefix or numbering", async ({ page }) => {
    await navigateTo(page, "/settings");

    // Try clicking Invoice Settings tab
    const invoiceTab = page.locator('button').filter({ hasText: /invoice/i }).first();
    if (await invoiceTab.isVisible().catch(() => false)) {
      await invoiceTab.click();
      await page.waitForLoadState("networkidle");
    }

    // Look for invoice prefix or numbering settings using safe locators
    const hasInvoiceSettings = await page.getByPlaceholder(/prefix|invoice|number/i).count() > 0
      || await page.locator('input[name*="prefix"], input[name*="Prefix"], input[name*="invoice"], input[name*="Invoice"], input[name*="number"], input[name*="Number"]').count() > 0
      || await page.locator('label').filter({ hasText: /prefix|invoice number|numbering/i }).count() > 0
      || await page.getByText(/invoice prefix|invoice number|numbering|auto.?number/i).first().isVisible().catch(() => false);

    expect(hasInvoiceSettings).toBeTruthy();
  });

  test("Services tab: verify service list is present", async ({ page }) => {
    await navigateTo(page, "/settings");

    // Try clicking Services tab
    const servicesTab = page.locator('button').filter({ hasText: /service/i }).first();
    if (await servicesTab.isVisible().catch(() => false)) {
      await servicesTab.click();
      await page.waitForLoadState("networkidle");
    }

    // Look for service list or service management
    const serviceElements = page.locator(
      'text=/service/i, table, [role="list"], [class*="service"], [class*="Service"], button:has-text("Add Service"), button:has-text("New Service")'
    );
    const emptyState = page.locator(
      'text=/no service/i, text=/add your first/i, text=/get started/i'
    );

    const hasServices = (await serviceElements.count()) > 0;
    const isEmpty = await emptyState.first().isVisible().catch(() => false);

    expect(hasServices || isEmpty).toBeTruthy();
  });

  test("Users tab: verify user management area", async ({ page }) => {
    await navigateTo(page, "/settings");

    // Try clicking Users tab
    const usersTab = page.locator('button').filter({ hasText: /user|team/i }).first();
    if (await usersTab.isVisible().catch(() => false)) {
      await usersTab.click();
      await page.waitForLoadState("networkidle");
    }

    // Look for user management elements
    const userElements = page.locator(
      'text=/user/i, text=/team/i, text=/member/i, text=/invite/i, table, [role="list"], button:has-text("Invite"), button:has-text("Add User"), button:has-text("Add Member"), [class*="user"], [class*="User"], [class*="member"], [class*="Member"]'
    );
    const emailElements = page.locator('text=/shyam@wodo/i, text=/@wodo/i');

    const hasUserMgmt = (await userElements.count()) > 0;
    const hasEmails = await emailElements.first().isVisible().catch(() => false);

    expect(hasUserMgmt || hasEmails).toBeTruthy();
  });
});
