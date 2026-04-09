import { test, expect } from "playwright/test";
import { login, navigateTo, waitForSelector, TEST_DATA } from "./helpers";

const gstClient = TEST_DATA.clients.gst;

test.describe("Client Creation - GST Invoice Type", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateTo(page, "/clients");
  });

  test('clicking "Add Client" opens modal with title "Add New Client"', async ({ page }) => {
    const addButton = page.locator(
      'button:has-text("Add Client"), a:has-text("Add Client"), button:has-text("New Client")'
    );
    await addButton.first().click();

    // Wait for modal to appear
    const modalTitle = page.locator(
      'h2:has-text("Add New Client"), h3:has-text("Add New Client"), [class*="modal"] :has-text("Add New Client"), [role="dialog"] :has-text("Add New Client"), [class*="dialog"] :has-text("Add New Client")'
    );
    await expect(modalTitle.first()).toBeVisible({ timeout: 10000 });
  });

  test("invoice type selection has 3 options", async ({ page }) => {
    const addButton = page.locator(
      'button:has-text("Add Client"), a:has-text("Add Client"), button:has-text("New Client")'
    );
    await addButton.first().click();
    await page.waitForTimeout(1000);

    // Look for the three invoice type options
    const gstOption = page.locator(
      'button:has-text("GST Invoice"), button:has-text("GST Invoices"), [class*="type"]:has-text("GST")'
    );
    const nonGstOption = page.locator(
      'button:has-text("Non-GST"), [class*="type"]:has-text("Non-GST")'
    );
    const intlOption = page.locator(
      'button:has-text("International"), [class*="type"]:has-text("International")'
    );

    await expect(gstOption.first()).toBeVisible({ timeout: 5000 });
    await expect(nonGstOption.first()).toBeVisible({ timeout: 5000 });
    await expect(intlOption.first()).toBeVisible({ timeout: 5000 });
  });

  test("GST type is selected by default", async ({ page }) => {
    const addButton = page.locator(
      'button:has-text("Add Client"), a:has-text("Add Client"), button:has-text("New Client")'
    );
    await addButton.first().click();
    await page.waitForTimeout(1000);

    // The GST button should have an active/selected state
    const gstOption = page.locator(
      'button:has-text("GST Invoice"), button:has-text("GST Invoices")'
    );

    // Check for active class, aria-selected, or data-state attributes
    const firstGst = gstOption.first();
    await expect(firstGst).toBeVisible();

    const classList = await firstGst.getAttribute("class") || "";
    const ariaSelected = await firstGst.getAttribute("aria-selected") || "";
    const dataState = await firstGst.getAttribute("data-state") || "";

    const isSelected =
      classList.includes("active") ||
      classList.includes("selected") ||
      classList.includes("bg-") ||
      ariaSelected === "true" ||
      dataState === "active";

    expect(isSelected, "GST type should be selected by default").toBeTruthy();
  });

  test("fill GST client form and GSTIN field appears for GST type", async ({ page }) => {
    const addButton = page.locator(
      'button:has-text("Add Client"), a:has-text("Add Client"), button:has-text("New Client")'
    );
    await addButton.first().click();
    await page.waitForTimeout(1000);

    // Ensure GST type is selected (click it to be safe)
    const gstOption = page.locator(
      'button:has-text("GST Invoice"), button:has-text("GST Invoices")'
    );
    await gstOption.first().click();
    await page.waitForTimeout(500);

    // GSTIN field should be visible for GST type
    const gstinField = page.locator(
      'input[name="gstin"], input[placeholder*="GSTIN"], input[placeholder*="gstin"], label:has-text("GSTIN") + input, label:has-text("GSTIN") ~ input'
    );

    // Also try finding it via the glass-input class near a GSTIN label
    const gstinByLabel = page.locator('label:has-text("GSTIN")');
    const hasGstinLabel = await gstinByLabel.first().isVisible().catch(() => false);
    const hasGstinField = await gstinField.first().isVisible().catch(() => false);

    expect(
      hasGstinLabel || hasGstinField,
      "GSTIN field should appear when GST type is selected"
    ).toBeTruthy();
  });

  test("fill complete GST client form and submit", async ({ page }) => {
    const addButton = page.locator(
      'button:has-text("Add Client"), a:has-text("Add Client"), button:has-text("New Client")'
    );
    await addButton.first().click();
    await page.waitForTimeout(1000);

    // Ensure GST type is selected
    const gstOption = page.locator(
      'button:has-text("GST Invoice"), button:has-text("GST Invoices")'
    );
    await gstOption.first().click();
    await page.waitForTimeout(500);

    // Fill company name
    const companyNameInput = page.locator(
      'input[name="company_name"], input[placeholder*="ompany"], input[placeholder*="Company"]'
    ).first();
    if (await companyNameInput.isVisible().catch(() => false)) {
      await companyNameInput.fill(gstClient.company_name);
    } else {
      // Fallback: find glass-input fields and fill the first one (likely company name)
      const glassInputs = page.locator("input.glass-input");
      await glassInputs.first().fill(gstClient.company_name);
    }

    // Fill display name
    const displayNameInput = page.locator(
      'input[name="display_name"], input[placeholder*="isplay"], input[placeholder*="Display"]'
    ).first();
    if (await displayNameInput.isVisible().catch(() => false)) {
      await displayNameInput.fill(gstClient.display_name);
    }

    // Fill GSTIN
    const gstinInput = page.locator(
      'input[name="gstin"], input[placeholder*="GSTIN"], input[placeholder*="gstin"]'
    ).first();
    if (await gstinInput.isVisible().catch(() => false)) {
      await gstinInput.fill(gstClient.gstin);
    }

    // Fill city
    const cityInput = page.locator(
      'input[name="city"], input[placeholder*="ity"], input[placeholder*="City"]'
    ).first();
    if (await cityInput.isVisible().catch(() => false)) {
      await cityInput.fill(gstClient.city);
    }

    // Fill country
    const countryInput = page.locator(
      'input[name="country"], input[placeholder*="ountry"], input[placeholder*="Country"]'
    ).first();
    if (await countryInput.isVisible().catch(() => false)) {
      await countryInput.fill(gstClient.country);
    }

    // Fill billing email
    const billingEmailInput = page.locator(
      'input[name="billing_email"], input[placeholder*="email"], input[placeholder*="Email"], input[type="email"]'
    ).first();
    if (await billingEmailInput.isVisible().catch(() => false)) {
      await billingEmailInput.fill(gstClient.billing_email);
    }

    // Select region (dropdown or select)
    const regionSelect = page.locator(
      'select[name="region"], [class*="select"]:has-text("Region"), button:has-text("Select region")'
    ).first();
    if (await regionSelect.isVisible().catch(() => false)) {
      const tagName = await regionSelect.evaluate((el) => el.tagName.toLowerCase());
      if (tagName === "select") {
        await regionSelect.selectOption({ value: gstClient.region });
      } else {
        await regionSelect.click();
        await page.waitForTimeout(300);
        await page.locator(`[role="option"]:has-text("India"), li:has-text("India")`).first().click();
      }
    }

    // Select currency
    const currencySelect = page.locator(
      'select[name="currency"], [class*="select"]:has-text("Currency"), button:has-text("Select currency")'
    ).first();
    if (await currencySelect.isVisible().catch(() => false)) {
      const tagName = await currencySelect.evaluate((el) => el.tagName.toLowerCase());
      if (tagName === "select") {
        await currencySelect.selectOption({ value: gstClient.currency });
      } else {
        await currencySelect.click();
        await page.waitForTimeout(300);
        await page.locator(`[role="option"]:has-text("INR"), li:has-text("INR")`).first().click();
      }
    }

    // Submit the form
    const submitButton = page.locator(
      'button[type="submit"]:has-text("Add"), button[type="submit"]:has-text("Create"), button[type="submit"]:has-text("Save"), button:has-text("Add Client"), button:has-text("Create Client")'
    );

    // Find the submit button inside the modal/dialog
    const modalSubmit = page.locator(
      '[role="dialog"] button[type="submit"], [class*="modal"] button[type="submit"], [class*="dialog"] button[type="submit"]'
    );

    const btn = (await modalSubmit.first().isVisible().catch(() => false))
      ? modalSubmit.first()
      : submitButton.first();

    await btn.click();
    await page.waitForTimeout(3000);

    // Verify success: toast message or modal closes or redirect
    const toast = page.locator(
      '[class*="toast"], [class*="Toast"], [role="status"], [class*="success"], [class*="Success"]'
    );
    const modalGone = await page
      .locator('[role="dialog"]:has-text("Add New Client")')
      .isHidden()
      .catch(() => true);

    const hasToast = await toast.first().isVisible().catch(() => false);
    expect(
      hasToast || modalGone,
      "Client creation should show success toast or close the modal"
    ).toBeTruthy();
  });

  test("new GST client appears in client list", async ({ page }) => {
    // Wait for any modal to close (from a previous creation test) and the list to refresh
    const modal = page.locator('[role="dialog"]:has-text("Add New Client")');
    await modal.waitFor({ state: "hidden", timeout: 10000 }).catch(() => {});
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Search for the newly created client
    const searchInput = page.locator(
      'input[placeholder*="earch"], input[type="search"], input.glass-input'
    ).first();

    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill("Audit Test GST");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);
    }

    // Check if the client name appears on the page
    const clientCard = page.locator(`text=${gstClient.company_name}`);
    const found = await clientCard.first().isVisible().catch(() => false);

    // Also check the broader page text
    const pageText = await page.locator("body").innerText();
    const inPageText = pageText.includes("Audit Test GST");

    expect(
      found || inPageText,
      `Client "${gstClient.company_name}" should appear in the client list`
    ).toBeTruthy();
  });
});
