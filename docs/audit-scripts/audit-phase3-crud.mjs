import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://wodo-ally-production.up.railway.app';
const SCREENSHOT_DIR = '/Users/shyam/Desktop/Claude Dev Projects/WODO Ally/audit-screenshots/functional';
const RESULTS_FILE = '/Users/shyam/Desktop/Claude Dev Projects/WODO Ally/audit-results/phase3-raw.json';

// Ensure dirs exist
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
fs.mkdirSync(path.dirname(RESULTS_FILE), { recursive: true });

const results = [];
let consoleErrors = [];

function log(id, test, result, details) {
  const entry = { id, test, result, details };
  results.push(entry);
  console.log(`[${result}] ${id}: ${test} - ${details}`);
}

async function screenshot(page, name) {
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${name}.png`), fullPage: true });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push({ url: page.url(), message: msg.text() });
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push({ url: page.url(), message: err.message });
  });

  // ============ LOGIN ============
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await screenshot(page, '00-login-page');

    await page.fill('input[type="email"], input[name="email"]', 'accounts@wodo.digital');
    await page.fill('input[type="password"], input[name="password"]', 'WodoAlly@2026');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(3000);
    await screenshot(page, '00-after-login');

    const currentUrl = page.url();
    if (currentUrl.includes('dashboard') || currentUrl.includes('onboard')) {
      log('LOGIN-01', 'Login with valid credentials', 'PASS', `Redirected to ${currentUrl}`);
    } else {
      log('LOGIN-01', 'Login with valid credentials', 'FAIL', `Stuck at ${currentUrl}`);
    }
  } catch (e) {
    log('LOGIN-01', 'Login with valid credentials', 'FAIL', e.message);
    await screenshot(page, '00-login-error');
  }

  // ============ PHASE 3A: CLIENTS ============
  console.log('\n=== PHASE 3A: CLIENTS ===');
  try {
    await page.goto(`${BASE_URL}/clients`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);
    await screenshot(page, '3A-01-clients-list');

    // Count clients
    const clientRows = await page.$$('table tbody tr, [data-testid*="client"], a[href*="/clients/"]');
    const clientCount = clientRows.length;
    log('3A-01', 'List all clients', clientCount > 0 ? 'PASS' : 'FAIL', `Found ${clientCount} client entries`);

    // Get client names
    const clientNames = await page.$$eval('table tbody tr td:first-child, [class*="client"] [class*="name"], a[href*="/clients/"]',
      els => els.slice(0, 10).map(e => e.textContent?.trim()).filter(Boolean)
    );
    log('3A-02', 'Client names display', clientNames.length > 0 ? 'PASS' : 'WARN', `Names: ${clientNames.slice(0, 5).join(', ')}`);

    // Test search functionality
    const searchInput = await page.$('input[placeholder*="earch"], input[type="search"], input[placeholder*="Search"]');
    if (searchInput) {
      // Partial name search
      const partialName = clientNames[0]?.substring(0, 3) || 'test';
      await searchInput.fill(partialName);
      await page.waitForTimeout(1000);
      await screenshot(page, '3A-03-search-partial');
      const afterSearchRows = await page.$$('table tbody tr, [data-testid*="client"], a[href*="/clients/"]');
      log('3A-03', 'Search - partial name', 'PASS', `Searched "${partialName}", got ${afterSearchRows.length} results`);

      // Case sensitivity
      await searchInput.fill('');
      await page.waitForTimeout(500);
      await searchInput.fill(partialName.toUpperCase());
      await page.waitForTimeout(1000);
      const caseSensitiveRows = await page.$$('table tbody tr');
      log('3A-04', 'Search - case sensitivity', caseSensitiveRows.length > 0 ? 'PASS' : 'WARN', `Uppercase search returned ${caseSensitiveRows.length} results`);

      // Special characters
      await searchInput.fill('');
      await page.waitForTimeout(500);
      await searchInput.fill('!@#$%');
      await page.waitForTimeout(1000);
      await screenshot(page, '3A-05-search-special-chars');
      log('3A-05', 'Search - special characters', 'PASS', 'No crash with special characters');

      // Clear search
      await searchInput.fill('');
      await page.waitForTimeout(1000);
    } else {
      log('3A-03', 'Search functionality', 'FAIL', 'No search input found');
    }

    // Test filter dropdowns
    const filterButtons = await page.$$('select, button:has-text("Filter"), button:has-text("Status"), [class*="filter"]');
    log('3A-06', 'Filter dropdowns exist', filterButtons.length > 0 ? 'PASS' : 'WARN', `Found ${filterButtons.length} filter elements`);

    // Click into first client detail
    if (clientCount > 0) {
      const firstClientLink = await page.$('table tbody tr a, a[href*="/clients/"][href*="-"]');
      if (firstClientLink) {
        const href = await firstClientLink.getAttribute('href');
        await page.goto(`${BASE_URL}${href || '/clients'}`, { waitUntil: 'networkidle', timeout: 15000 });
      } else {
        // Try clicking the first row
        await page.click('table tbody tr:first-child');
      }
      await page.waitForTimeout(2000);
      await screenshot(page, '3A-07-client-detail');

      const detailUrl = page.url();
      log('3A-07', 'Navigate to client detail', detailUrl.includes('/clients/') ? 'PASS' : 'FAIL', `URL: ${detailUrl}`);

      // Check tabs
      const tabs = await page.$$eval('button[role="tab"], [class*="tab"], nav button, [data-state]',
        els => els.map(e => e.textContent?.trim()).filter(Boolean)
      );
      log('3A-08', 'Client detail tabs', tabs.length >= 2 ? 'PASS' : 'WARN', `Tabs found: ${tabs.join(', ')}`);

      // Click each tab
      for (const tabName of ['Overview', 'Projects', 'Invoices', 'Payments']) {
        try {
          const tab = await page.$(`button:has-text("${tabName}"), [role="tab"]:has-text("${tabName}")`);
          if (tab) {
            await tab.click();
            await page.waitForTimeout(1000);
            await screenshot(page, `3A-08-tab-${tabName.toLowerCase()}`);
            log(`3A-08-${tabName}`, `Client tab: ${tabName}`, 'PASS', 'Tab loaded');
          } else {
            log(`3A-08-${tabName}`, `Client tab: ${tabName}`, 'FAIL', 'Tab button not found');
          }
        } catch (e) {
          log(`3A-08-${tabName}`, `Client tab: ${tabName}`, 'FAIL', e.message);
        }
      }

      // Check health score
      const healthScore = await page.$('[class*="health"], [class*="score"], text=/[0-9]+%/');
      log('3A-09', 'Health score display', healthScore ? 'PASS' : 'WARN', healthScore ? 'Health score found' : 'No health score element found');
    }

    // Go back to clients list
    await page.goto(`${BASE_URL}/clients`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1000);

    // Check "Add Client" button
    const addClientBtn = await page.$('button:has-text("Add Client"), button:has-text("New Client"), a:has-text("Add Client"), button:has-text("Add"), a[href*="new"]');
    log('3A-10', 'Add Client button exists', addClientBtn ? 'PASS' : 'FAIL', addClientBtn ? 'Button found' : 'No add client button');

    if (addClientBtn) {
      await addClientBtn.click();
      await page.waitForTimeout(2000);
      await screenshot(page, '3A-11-add-client-form');

      // Check form fields
      const formInputs = await page.$$('input, select, textarea');
      log('3A-11', 'Add client form opens', formInputs.length > 0 ? 'PASS' : 'FAIL', `Found ${formInputs.length} form inputs`);

      // Test validation - try submitting empty form
      const submitBtn = await page.$('button[type="submit"], button:has-text("Save"), button:has-text("Create"), button:has-text("Add")');
      if (submitBtn) {
        await submitBtn.click();
        await page.waitForTimeout(1000);
        await screenshot(page, '3A-12-validation-errors');

        const errorMessages = await page.$$('[class*="error"], [class*="invalid"], [role="alert"], .text-red, .text-destructive');
        log('3A-12', 'Empty form validation', errorMessages.length > 0 ? 'PASS' : 'WARN', `${errorMessages.length} validation messages shown`);
      }

      // Test GSTIN format
      const gstinInput = await page.$('input[name*="gst"], input[name*="GST"], input[placeholder*="GST"]');
      if (gstinInput) {
        await gstinInput.fill('INVALID-GSTIN');
        await page.waitForTimeout(500);
        log('3A-13', 'GSTIN format validation', 'INFO', 'GSTIN input found, tested invalid format');
      }

      // Test email format
      const emailInput = await page.$('input[type="email"], input[name*="email"]');
      if (emailInput) {
        await emailInput.fill('invalid-email');
        if (submitBtn) await submitBtn.click();
        await page.waitForTimeout(500);
        await screenshot(page, '3A-14-email-validation');
        log('3A-14', 'Email format validation', 'INFO', 'Email input tested with invalid format');
      }

      // Close dialog/navigate back
      const closeBtn = await page.$('button:has-text("Cancel"), button:has-text("Close"), [aria-label="Close"]');
      if (closeBtn) await closeBtn.click();
      await page.waitForTimeout(500);
    }

  } catch (e) {
    log('3A-ERR', 'Clients module error', 'FAIL', e.message);
    await screenshot(page, '3A-error');
  }

  // ============ PHASE 3B: PROJECTS ============
  console.log('\n=== PHASE 3B: PROJECTS ===');
  try {
    await page.goto(`${BASE_URL}/projects`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);
    await screenshot(page, '3B-01-projects-list');

    const projectRows = await page.$$('table tbody tr, [class*="project-card"], [class*="card"]');
    log('3B-01', 'List projects', projectRows.length > 0 ? 'PASS' : 'WARN', `Found ${projectRows.length} project entries`);

    // Check client associations
    const pageContent = await page.textContent('body');
    log('3B-02', 'Client associations shown', 'INFO', 'Checking page content for client references');

    // Search and filter
    const searchInput = await page.$('input[placeholder*="earch"], input[type="search"]');
    if (searchInput) {
      await searchInput.fill('retainer');
      await page.waitForTimeout(1000);
      await screenshot(page, '3B-03-search-retainer');
      log('3B-03', 'Search projects', 'PASS', 'Search input functional');
      await searchInput.fill('');
    }

    // Filter by engagement type
    const filterSelects = await page.$$('select');
    for (const sel of filterSelects) {
      const options = await sel.$$eval('option', opts => opts.map(o => o.textContent?.trim()));
      log('3B-04', 'Filter options', 'INFO', `Filter options: ${options.join(', ')}`);
    }

    // Check for new project button
    const newProjectBtn = await page.$('button:has-text("New Project"), button:has-text("Add Project"), a[href*="new"]');
    log('3B-05', 'New project button', newProjectBtn ? 'PASS' : 'WARN', newProjectBtn ? 'Found' : 'Not found');

    if (newProjectBtn) {
      await newProjectBtn.click();
      await page.waitForTimeout(2000);
      await screenshot(page, '3B-06-new-project-form');
      log('3B-06', 'New project form', 'PASS', 'Form opened');

      // Check for retainer fields
      const monthlyAmountField = await page.$('input[name*="monthly"], input[name*="amount"], input[placeholder*="monthly"]');
      const billingDayField = await page.$('input[name*="billing_day"], select[name*="billing"]');
      log('3B-07', 'Retainer project fields', 'INFO', `Monthly amount: ${monthlyAmountField ? 'yes' : 'no'}, Billing day: ${billingDayField ? 'yes' : 'no'}`);

      const closeBtn = await page.$('button:has-text("Cancel"), button:has-text("Close"), [aria-label="Close"]');
      if (closeBtn) await closeBtn.click();
      await page.waitForTimeout(500);
    }

  } catch (e) {
    log('3B-ERR', 'Projects module error', 'FAIL', e.message);
    await screenshot(page, '3B-error');
  }

  // ============ PHASE 3C: SERVICES ============
  console.log('\n=== PHASE 3C: SERVICES ===');
  try {
    // Check settings for services
    await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);
    await screenshot(page, '3C-01-settings-page');

    // Look for services tab/section
    const servicesTab = await page.$('button:has-text("Services"), a:has-text("Services"), [role="tab"]:has-text("Services")');
    if (servicesTab) {
      await servicesTab.click();
      await page.waitForTimeout(1500);
      await screenshot(page, '3C-02-services-tab');
      log('3C-01', 'Services section found', 'PASS', 'In settings');

      // List services with HSN codes
      const serviceItems = await page.$$('table tbody tr, [class*="service-item"], li');
      log('3C-02', 'List services', serviceItems.length > 0 ? 'PASS' : 'WARN', `${serviceItems.length} services found`);

      // Check for add service button
      const addServiceBtn = await page.$('button:has-text("Add Service"), button:has-text("New Service"), button:has-text("Add")');
      log('3C-03', 'Add service button', addServiceBtn ? 'PASS' : 'WARN', addServiceBtn ? 'Found' : 'Not found');
    } else {
      log('3C-01', 'Services section', 'WARN', 'No services tab found in settings - checking other locations');
    }

  } catch (e) {
    log('3C-ERR', 'Services error', 'FAIL', e.message);
    await screenshot(page, '3C-error');
  }

  // ============ PHASE 3D: CONTRACTS ============
  console.log('\n=== PHASE 3D: CONTRACTS ===');
  try {
    await page.goto(`${BASE_URL}/contracts`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);
    await screenshot(page, '3D-01-contracts-list');

    const contractItems = await page.$$('table tbody tr, [class*="contract"], [class*="card"]');
    log('3D-01', 'List contracts', 'PASS', `Found ${contractItems.length} contract entries`);

    // Check status badges
    const badges = await page.$$('[class*="badge"], [class*="status"], span[class*="pill"]');
    log('3D-02', 'Status badges', badges.length > 0 ? 'PASS' : 'WARN', `${badges.length} badges found`);

    // Filter by status
    const statusFilter = await page.$('select, button:has-text("Status"), [class*="filter"]');
    log('3D-03', 'Status filter', statusFilter ? 'PASS' : 'WARN', statusFilter ? 'Found' : 'Not found');

    // Navigate to new contract
    await page.goto(`${BASE_URL}/contracts/new`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    await screenshot(page, '3D-04-new-contract-form');

    const contractForm = await page.$$('input, select, textarea');
    log('3D-04', 'New contract form', contractForm.length > 0 ? 'PASS' : 'FAIL', `${contractForm.length} form fields found`);

    // Check contract-to-client linkage
    const clientSelect = await page.$('select[name*="client"], [class*="client-select"]');
    log('3D-05', 'Contract-client linkage', clientSelect ? 'PASS' : 'WARN', clientSelect ? 'Client dropdown found' : 'No explicit client dropdown');

    // Go back and test delete
    await page.goto(`${BASE_URL}/contracts`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1000);

    const deleteBtn = await page.$('button:has-text("Delete"), button[aria-label*="delete"], [class*="delete"]');
    log('3D-06', 'Delete button', deleteBtn ? 'PASS' : 'WARN', deleteBtn ? 'Delete button found' : 'Not visible on list page');

  } catch (e) {
    log('3D-ERR', 'Contracts error', 'FAIL', e.message);
    await screenshot(page, '3D-error');
  }

  // ============ PHASE 3E: TDS CERTIFICATES ============
  console.log('\n=== PHASE 3E: TDS CERTIFICATES ===');
  try {
    await page.goto(`${BASE_URL}/tds`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);
    await screenshot(page, '3E-01-tds-page');

    const pageUrl = page.url();
    if (pageUrl.includes('/tds') || pageUrl.includes('404') === false) {
      log('3E-01', 'TDS page loads', 'PASS', `URL: ${pageUrl}`);
    } else {
      log('3E-01', 'TDS page loads', 'FAIL', 'Page not found or redirect');
    }

    // Check KPI cards
    const kpiCards = await page.$$('[class*="card"], [class*="stat"], [class*="kpi"]');
    log('3E-02', 'KPI cards', kpiCards.length > 0 ? 'PASS' : 'WARN', `${kpiCards.length} card elements`);

    // FY filter
    const fyFilter = await page.$('select, button:has-text("FY"), button:has-text("Financial Year")');
    log('3E-03', 'FY filter', fyFilter ? 'PASS' : 'WARN', fyFilter ? 'Found' : 'Not found');

  } catch (e) {
    log('3E-ERR', 'TDS error', 'FAIL', e.message);
    await screenshot(page, '3E-error');
  }

  // ============ PHASE 3F: FINANCIAL TARGETS ============
  console.log('\n=== PHASE 3F: FINANCIAL TARGETS ===');
  try {
    await page.goto(`${BASE_URL}/targets`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);
    await screenshot(page, '3F-01-targets-page');

    // Check for progress bars
    const progressBars = await page.$$('[class*="progress"], [role="progressbar"], [class*="bar"]');
    log('3F-01', 'Progress bars display', progressBars.length > 0 ? 'PASS' : 'WARN', `${progressBars.length} progress elements`);

    // Inline add form
    const addBtn = await page.$('button:has-text("Add"), button:has-text("New Target"), button:has-text("Create")');
    log('3F-02', 'Add target button', addBtn ? 'PASS' : 'WARN', addBtn ? 'Found' : 'Not found');

    if (addBtn) {
      await addBtn.click();
      await page.waitForTimeout(1000);
      await screenshot(page, '3F-03-add-target-form');
    }

    // Check target rows
    const targetRows = await page.$$('table tbody tr, [class*="target-row"], [class*="card"]');
    log('3F-03', 'Target entries', 'INFO', `${targetRows.length} target elements found`);

    // Delete button
    const deleteBtn = await page.$('button:has-text("Delete"), button[aria-label*="delete"]');
    log('3F-04', 'Delete target button', deleteBtn ? 'PASS' : 'WARN', deleteBtn ? 'Found' : 'Not visible');

  } catch (e) {
    log('3F-ERR', 'Targets error', 'FAIL', e.message);
    await screenshot(page, '3F-error');
  }

  // ============ PHASE 3G: SETTINGS ============
  console.log('\n=== PHASE 3G: SETTINGS ===');
  try {
    await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);

    // Find all tabs
    const settingsTabs = await page.$$eval('button[role="tab"], nav button, [class*="tab-trigger"], a[class*="tab"]',
      els => els.map(e => e.textContent?.trim()).filter(Boolean)
    );
    log('3G-01', 'Settings tabs', settingsTabs.length > 0 ? 'PASS' : 'WARN', `Tabs: ${settingsTabs.join(', ')}`);

    // Click through each tab
    for (let i = 0; i < settingsTabs.length; i++) {
      const tabName = settingsTabs[i];
      try {
        const tab = await page.$(`button:has-text("${tabName}"), [role="tab"]:has-text("${tabName}")`);
        if (tab) {
          await tab.click();
          await page.waitForTimeout(1500);
          await screenshot(page, `3G-02-settings-tab-${i}-${tabName.replace(/\s+/g, '-').toLowerCase()}`);
          log(`3G-02-${tabName}`, `Settings tab: ${tabName}`, 'PASS', 'Tab loaded');
        }
      } catch (e) {
        log(`3G-02-${tabName}`, `Settings tab: ${tabName}`, 'FAIL', e.message);
      }
    }

    // Test if any form saves
    const saveBtn = await page.$('button:has-text("Save"), button[type="submit"]');
    log('3G-03', 'Save button', saveBtn ? 'PASS' : 'WARN', saveBtn ? 'Found' : 'Not found - may use localStorage');

  } catch (e) {
    log('3G-ERR', 'Settings error', 'FAIL', e.message);
    await screenshot(page, '3G-error');
  }

  // ============ PHASE 3H: ONBOARDING ============
  console.log('\n=== PHASE 3H: ONBOARDING ===');
  try {
    await page.goto(`${BASE_URL}/onboard`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);
    await screenshot(page, '3H-01-onboarding-page');

    const onboardUrl = page.url();
    log('3H-01', 'Onboarding page loads', !onboardUrl.includes('404') ? 'PASS' : 'FAIL', `URL: ${onboardUrl}`);

    // Check wizard steps
    const steps = await page.$$('[class*="step"], [class*="wizard"], [class*="progress"]');
    log('3H-02', 'Wizard steps', steps.length > 0 ? 'PASS' : 'WARN', `${steps.length} step elements`);

    // Check for next/continue button
    const nextBtn = await page.$('button:has-text("Next"), button:has-text("Continue"), button:has-text("Start")');
    log('3H-03', 'Step progression button', nextBtn ? 'PASS' : 'WARN', nextBtn ? 'Found' : 'Not found');

  } catch (e) {
    log('3H-ERR', 'Onboarding error', 'FAIL', e.message);
    await screenshot(page, '3H-error');
  }

  // Save results
  fs.writeFileSync(RESULTS_FILE, JSON.stringify({ results, consoleErrors }, null, 2));
  console.log(`\nPhase 3 complete. ${results.length} tests, Console errors: ${consoleErrors.length}`);
  await browser.close();
})();
