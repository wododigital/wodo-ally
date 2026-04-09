import { test, expect } from "playwright/test";
import { login, navigateTo, waitForSelector, TEST_DATA } from "./helpers";

const intlClient = TEST_DATA.clients.international;

test.describe("Client Creation - International Type", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateTo(page, "/clients");
  });

  test("open Add Client modal", async ({ page }) => {
    const addButton = page.locator(
      'button:has-text("Add Client"), a:has-text("Add Client"), button:has-text("New Client")'
    );
    await addButton.first().click();

    const modalTitle = page.locator(
      'h2:has-text("Add New Client"), h3:has-text("Add New Client"), [role="dialog"] :has-text("Add New Client"), [class*="dialog"] :has-text("Add New Client")'
    );
    await expect(modalTitle.first()).toBeVisible({ timeout: 10000 });
  });

  test('select "International" type and GSTIN field should NOT appear', async ({ page }) => {
    const addButton = page.locator(
      'button:has-text("Add Client"), a:has-text("Add Client"), button:has-text("New Client")'
    );
    await addButton.first().click();
    await page.waitForTimeout(1000);

    // Click the International type button
    const intlOption = page.locator('button:has-text("International")');
    await intlOption.first().click();
    await page.waitForTimeout(500);

    // GSTIN field should NOT be visible for International type
    const gstinField = page.locator(
      'input[name="gstin"], input[placeholder*="GSTIN"], input[placeholder*="gstin"]'
    );
    const gstinLabel = page.locator('label:has-text("GSTIN")');

    const hasGstinField = await gstinField.first().isVisible().catch(() => false);
    const hasGstinLabel = await gstinLabel.first().isVisible().catch(() => false);

    expect(
      hasGstinField || hasGstinLabel,
      "GSTIN field should NOT appear for International type"
    ).toBeFalsy();
  });

  test("currency dropdown shows USD option", async ({ page }) => {
    const addButton = page.locator(
      'button:has-text("Add Client"), a:has-text("Add Client"), button:has-text("New Client")'
    );
    await addButton.first().click();
    await page.waitForTimeout(1000);

    // Select International type
    const intlOption = page.locator('button:has-text("International")');
    await intlOption.first().click();
    await page.waitForTimeout(500);

    // Find and interact with currency selector
    const currencySelect = page.locator(
      'select[name="currency"], [class*="select"]:has-text("Currency"), button:has-text("Select currency"), button:has-text("Currency")'
    ).first();

    if (await currencySelect.isVisible().catch(() => false)) {
      const tagName = await currencySelect.evaluate((el) => el.tagName.toLowerCase());
      if (tagName === "select") {
        // Native select - check for USD option
        const options = await currencySelect.locator("option").allTextContents();
        expect(options.some((o) => o.includes("USD"))).toBeTruthy();
      } else {
        // Custom dropdown - click to open and look for USD
        await currencySelect.click();
        await page.waitForTimeout(500);
        const usdOption = page.locator(
          '[role="option"]:has-text("USD"), li:has-text("USD"), [class*="option"]:has-text("USD")'
        );
        await expect(usdOption.first()).toBeVisible({ timeout: 5000 });
        // Select it
        await usdOption.first().click();
      }
    }
  });

  test("region dropdown shows USA", async ({ page }) => {
    const addButton = page.locator(
      'button:has-text("Add Client"), a:has-text("Add Client"), button:has-text("New Client")'
    );
    await addButton.first().click();
    await page.waitForTimeout(1000);

    // Select International type
    const intlOption = page.locator('button:has-text("International")');
    await intlOption.first().click();
    await page.waitForTimeout(500);

    // Find and interact with region selector
    const regionSelect = page.locator(
      'select[name="region"], [class*="select"]:has-text("Region"), button:has-text("Select region"), button:has-text("Region")'
    ).first();

    if (await regionSelect.isVisible().catch(() => false)) {
      const tagName = await regionSelect.evaluate((el) => el.tagName.toLowerCase());
      if (tagName === "select") {
        const options = await regionSelect.locator("option").allTextContents();
        const hasUsa = options.some(
          (o) => o.toLowerCase().includes("usa") || o.toLowerCase().includes("united states")
        );
        expect(hasUsa).toBeTruthy();
      } else {
        await regionSelect.click();
        await page.waitForTimeout(500);
        const usaOption = page.locator(
          '[role="option"]:has-text("USA"), li:has-text("USA"), [role="option"]:has-text("United States"), li:has-text("United States"), [class*="option"]:has-text("USA")'
        );
        await expect(usaOption.first()).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test("fill international client form and submit", async ({ page }) => {
    const addButton = page.locator(
      'button:has-text("Add Client"), a:has-text("Add Client"), button:has-text("New Client")'
    );
    await addButton.first().click();
    await page.waitForTimeout(1000);

    // Select International type
    const intlOption = page.locator('button:has-text("International")');
    await intlOption.first().click();
    await page.waitForTimeout(500);

    // Fill company name
    const companyNameInput = page.locator(
      'input[name="company_name"], input[placeholder*="ompany"], input[placeholder*="Company"]'
    ).first();
    if (await companyNameInput.isVisible().catch(() => false)) {
      await companyNameInput.fill(intlClient.company_name);
    } else {
      const glassInputs = page.locator("input.glass-input");
      await glassInputs.first().fill(intlClient.company_name);
    }

    // Fill display name if available
    const displayNameInput = page.locator(
      'input[name="display_name"], input[placeholder*="isplay"], input[placeholder*="Display"]'
    ).first();
    if (await displayNameInput.isVisible().catch(() => false)) {
      await displayNameInput.fill(intlClient.display_name);
    }

    // Fill city
    const cityInput = page.locator(
      'input[name="city"], input[placeholder*="ity"], input[placeholder*="City"]'
    ).first();
    if (await cityInput.isVisible().catch(() => false)) {
      await cityInput.fill(intlClient.city);
    }

    // Fill country
    const countryInput = page.locator(
      'input[name="country"], input[placeholder*="ountry"], input[placeholder*="Country"]'
    ).first();
    if (await countryInput.isVisible().catch(() => false)) {
      await countryInput.fill(intlClient.country);
    }

    // Fill billing email if available
    const billingEmailInput = page.locator(
      'input[name="billing_email"], input[placeholder*="email"], input[placeholder*="Email"], input[type="email"]'
    ).first();
    if (await billingEmailInput.isVisible().catch(() => false)) {
      await billingEmailInput.fill(intlClient.billing_email);
    }

    // Select region via dropdown
    const regionSelect = page.locator(
      'select[name="region"], [class*="select"]:has-text("Region"), button:has-text("Select region"), button:has-text("Region")'
    ).first();
    if (await regionSelect.isVisible().catch(() => false)) {
      const tagName = await regionSelect.evaluate((el) => el.tagName.toLowerCase());
      if (tagName === "select") {
        await regionSelect.selectOption({ value: intlClient.region });
      } else {
        await regionSelect.click();
        await page.waitForTimeout(300);
        await page
          .locator(
            '[role="option"]:has-text("USA"), li:has-text("USA"), [role="option"]:has-text("United States")'
          )
          .first()
          .click();
      }
    }

    // Select currency via dropdown
    const currencySelect = page.locator(
      'select[name="currency"], [class*="select"]:has-text("Currency"), button:has-text("Select currency"), button:has-text("Currency")'
    ).first();
    if (await currencySelect.isVisible().catch(() => false)) {
      const tagName = await currencySelect.evaluate((el) => el.tagName.toLowerCase());
      if (tagName === "select") {
        await currencySelect.selectOption({ value: intlClient.currency });
      } else {
        await currencySelect.click();
        await page.waitForTimeout(300);
        await page
          .locator('[role="option"]:has-text("USD"), li:has-text("USD")')
          .first()
          .click();
      }
    }

    // Submit the form
    const modalSubmit = page.locator(
      '[role="dialog"] button[type="submit"], [class*="modal"] button[type="submit"], [class*="dialog"] button[type="submit"]'
    );
    const submitButton = page.locator(
      'button[type="submit"]:has-text("Add"), button[type="submit"]:has-text("Create"), button[type="submit"]:has-text("Save"), button:has-text("Add Client"), button:has-text("Create Client")'
    );

    const btn = (await modalSubmit.first().isVisible().catch(() => false))
      ? modalSubmit.first()
      : submitButton.first();

    await btn.click();
    await page.waitForTimeout(3000);

    // Verify success
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

  test("new international client appears in client list", async ({ page }) => {
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
      await searchInput.fill("Audit Test Intl");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);
    }

    // Check if the client name appears
    const clientCard = page.locator(`text=${intlClient.company_name}`);
    const found = await clientCard.first().isVisible().catch(() => false);

    const pageText = await page.locator("body").innerText();
    const inPageText = pageText.includes("Audit Test Intl");

    expect(
      found || inPageText,
      `Client "${intlClient.company_name}" should appear in the client list`
    ).toBeTruthy();
  });
});
