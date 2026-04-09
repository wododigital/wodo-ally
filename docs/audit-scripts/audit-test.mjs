import { chromium } from 'playwright';
import fs from 'fs';

const BASE_URL = 'https://wodo-ally-production.up.railway.app';
const CREDS = { email: 'accounts@wodo.digital', password: 'WodoAlly@2026' };
const SCREENSHOTS_DIR = '/Users/shyam/Desktop/Claude Dev Projects/WODO Ally/audit-screenshots';

fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const results = {
  login: null,
  pages: {},
  functionality: {},
  ux_issues: [],
  errors: [],
  console_errors: [],
  network_errors: [],
  timestamps: { start: new Date().toISOString() }
};

async function screenshot(page, name) {
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/${name}.png`, fullPage: true });
}

async function waitAndScreenshot(page, name, waitFor = 3000) {
  await page.waitForTimeout(waitFor);
  await screenshot(page, name);
}

async function collectConsoleErrors(page) {
  page.on('console', msg => {
    if (msg.type() === 'error') {
      results.console_errors.push({ text: msg.text(), url: page.url() });
    }
  });
  page.on('pageerror', err => {
    results.errors.push({ message: err.message, url: page.url() });
  });
  page.on('response', resp => {
    if (resp.status() >= 400) {
      results.network_errors.push({ url: resp.url(), status: resp.status(), page: page.url() });
    }
  });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  });
  const page = await context.newPage();
  await collectConsoleErrors(page);

  // ===== 1. LOGIN =====
  console.log('--- LOGIN TEST ---');
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await waitAndScreenshot(page, '01-login-page');

    // Check login page elements
    const emailInput = await page.$('input[type="email"], input[name="email"]');
    const passInput = await page.$('input[type="password"], input[name="password"]');
    const submitBtn = await page.$('button[type="submit"]');

    results.login = { hasEmailField: !!emailInput, hasPasswordField: !!passInput, hasSubmitBtn: !!submitBtn };

    if (emailInput && passInput) {
      await emailInput.fill(CREDS.email);
      await passInput.fill(CREDS.password);
      await waitAndScreenshot(page, '02-login-filled');

      if (submitBtn) await submitBtn.click();
      await page.waitForTimeout(5000);
      await waitAndScreenshot(page, '03-after-login');

      const currentUrl = page.url();
      results.login.redirectedTo = currentUrl;
      results.login.success = !currentUrl.includes('/login');
      console.log(`Login result: ${results.login.success ? 'SUCCESS' : 'FAILED'} - redirected to ${currentUrl}`);
    }
  } catch (e) {
    results.login = { error: e.message };
    console.log(`Login error: ${e.message}`);
  }

  // ===== 2. DASHBOARD =====
  console.log('--- DASHBOARD TEST ---');
  try {
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });
    await waitAndScreenshot(page, '04-dashboard', 4000);

    const kpiCards = await page.$$('[class*="glass-card"], [class*="stat-card"], [class*="kpi"]');
    const navItems = await page.$$('nav a, [class*="nav"] a');
    const navTexts = await Promise.all(navItems.map(n => n.textContent()));

    results.pages.dashboard = {
      loaded: true,
      kpiCardCount: kpiCards.length,
      navItems: navTexts.filter(t => t?.trim()).map(t => t.trim()),
      url: page.url()
    };
    console.log(`Dashboard: ${kpiCards.length} KPI cards, ${navTexts.length} nav items`);
  } catch (e) {
    results.pages.dashboard = { error: e.message };
  }

  // ===== 3. CLIENTS =====
  console.log('--- CLIENTS TEST ---');
  try {
    await page.goto(`${BASE_URL}/clients`, { waitUntil: 'networkidle', timeout: 30000 });
    await waitAndScreenshot(page, '05-clients-list', 4000);

    const clientCards = await page.$$('[class*="glass-card"], [class*="client-card"], table tbody tr, [class*="grid"] > div');
    const searchInput = await page.$('input[placeholder*="search" i], input[placeholder*="Search" i], input[type="search"]');
    const addBtn = await page.$('button:has-text("Add"), button:has-text("New"), button:has-text("Create"), a:has-text("Add"), a:has-text("New")');

    results.pages.clients = {
      loaded: true,
      clientCount: clientCards.length,
      hasSearch: !!searchInput,
      hasAddButton: !!addBtn,
    };

    // Try clicking first client to test detail view
    const firstClientLink = await page.$('a[href*="/clients/"]');
    if (firstClientLink) {
      await firstClientLink.click();
      await page.waitForTimeout(4000);
      await waitAndScreenshot(page, '06-client-detail');
      results.pages.clientDetail = { loaded: true, url: page.url() };

      // Check tabs
      const tabs = await page.$$('[role="tab"], button[class*="tab"], [class*="tab-trigger"]');
      const tabTexts = await Promise.all(tabs.map(t => t.textContent()));
      results.pages.clientDetail.tabs = tabTexts.map(t => t?.trim()).filter(Boolean);
    }
  } catch (e) {
    results.pages.clients = { error: e.message };
  }

  // ===== 4. INVOICES =====
  console.log('--- INVOICES TEST ---');
  try {
    await page.goto(`${BASE_URL}/invoices`, { waitUntil: 'networkidle', timeout: 30000 });
    await waitAndScreenshot(page, '07-invoices-list', 4000);

    const invoiceRows = await page.$$('table tbody tr, [class*="invoice-card"], [class*="glass-card"]');
    const statusTabs = await page.$$('[role="tab"], button[class*="tab"]');
    const tabTexts = await Promise.all(statusTabs.map(t => t.textContent()));

    results.pages.invoices = {
      loaded: true,
      invoiceCount: invoiceRows.length,
      statusTabs: tabTexts.map(t => t?.trim()).filter(Boolean),
    };

    // Try to open new invoice modal/page
    const newInvoiceBtn = await page.$('button:has-text("New"), button:has-text("Create"), button:has-text("Add"), a:has-text("New Invoice")');
    if (newInvoiceBtn) {
      await newInvoiceBtn.click();
      await page.waitForTimeout(3000);
      await waitAndScreenshot(page, '08-new-invoice-form');
      results.functionality.newInvoice = { formVisible: true, url: page.url() };
    }

    // Check first invoice detail
    await page.goto(`${BASE_URL}/invoices`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    const firstInvoiceLink = await page.$('a[href*="/invoices/"]');
    if (firstInvoiceLink) {
      await firstInvoiceLink.click();
      await page.waitForTimeout(4000);
      await waitAndScreenshot(page, '09-invoice-detail');
      results.pages.invoiceDetail = { loaded: true, url: page.url() };

      // Check for PDF, email, payment buttons
      const pdfBtn = await page.$('button:has-text("PDF"), button:has-text("Download"), button:has-text("Generate")');
      const emailBtn = await page.$('button:has-text("Email"), button:has-text("Send")');
      const paymentBtn = await page.$('button:has-text("Payment"), button:has-text("Record")');
      results.pages.invoiceDetail.hasPdfButton = !!pdfBtn;
      results.pages.invoiceDetail.hasEmailButton = !!emailBtn;
      results.pages.invoiceDetail.hasPaymentButton = !!paymentBtn;
    }
  } catch (e) {
    results.pages.invoices = { error: e.message };
  }

  // ===== 5. PAYMENTS =====
  console.log('--- PAYMENTS TEST ---');
  try {
    await page.goto(`${BASE_URL}/payments`, { waitUntil: 'networkidle', timeout: 30000 });
    await waitAndScreenshot(page, '10-payments', 4000);

    const paymentRows = await page.$$('table tbody tr, [class*="payment-card"]');
    results.pages.payments = { loaded: true, paymentCount: paymentRows.length };
  } catch (e) {
    results.pages.payments = { error: e.message };
  }

  // ===== 6. EXPENSES =====
  console.log('--- EXPENSES TEST ---');
  try {
    await page.goto(`${BASE_URL}/expenses`, { waitUntil: 'networkidle', timeout: 30000 });
    await waitAndScreenshot(page, '11-expenses', 4000);

    const categoryCards = await page.$$('[class*="glass-card"], [class*="category"]');
    results.pages.expenses = { loaded: true, categoryCount: categoryCards.length };

    // Check upload page
    await page.goto(`${BASE_URL}/expenses/upload`, { waitUntil: 'networkidle', timeout: 30000 });
    await waitAndScreenshot(page, '12-expenses-upload', 3000);
    const dropZone = await page.$('[class*="drop"], [class*="upload"], input[type="file"]');
    results.pages.expenseUpload = { loaded: true, hasDropZone: !!dropZone };

    // Check transactions page
    await page.goto(`${BASE_URL}/expenses/transactions`, { waitUntil: 'networkidle', timeout: 30000 });
    await waitAndScreenshot(page, '13-expenses-transactions', 3000);
    results.pages.expenseTransactions = { loaded: true };
  } catch (e) {
    results.pages.expenses = { error: e.message };
  }

  // ===== 7. ANALYTICS =====
  console.log('--- ANALYTICS TEST ---');
  try {
    const analyticsPages = ['analytics', 'analytics/pl', 'analytics/balance', 'analytics/invoices', 'analytics/expenses', 'analytics/clients', 'analytics/projects'];
    for (const ap of analyticsPages) {
      await page.goto(`${BASE_URL}/${ap}`, { waitUntil: 'networkidle', timeout: 30000 });
      await waitAndScreenshot(page, `14-${ap.replace('/', '-')}`, 4000);
      const charts = await page.$$('svg[class*="recharts"], [class*="chart"], .recharts-wrapper');
      results.pages[ap] = { loaded: true, chartCount: charts.length };
      console.log(`${ap}: ${charts.length} charts`);
    }
  } catch (e) {
    results.pages.analytics = { error: e.message };
  }

  // ===== 8. PROJECTS =====
  console.log('--- PROJECTS TEST ---');
  try {
    await page.goto(`${BASE_URL}/projects`, { waitUntil: 'networkidle', timeout: 30000 });
    await waitAndScreenshot(page, '15-projects', 4000);

    const projectCards = await page.$$('[class*="glass-card"], [class*="project-card"], table tbody tr');
    results.pages.projects = { loaded: true, projectCount: projectCards.length };
  } catch (e) {
    results.pages.projects = { error: e.message };
  }

  // ===== 9. CONTRACTS =====
  console.log('--- CONTRACTS TEST ---');
  try {
    await page.goto(`${BASE_URL}/contracts`, { waitUntil: 'networkidle', timeout: 30000 });
    await waitAndScreenshot(page, '16-contracts', 4000);
    results.pages.contracts = { loaded: true };

    // Try new contract
    await page.goto(`${BASE_URL}/contracts/new`, { waitUntil: 'networkidle', timeout: 30000 });
    await waitAndScreenshot(page, '17-contracts-new', 3000);
    results.pages.contractNew = { loaded: true };
  } catch (e) {
    results.pages.contracts = { error: e.message };
  }

  // ===== 10. REPORTS =====
  console.log('--- REPORTS TEST ---');
  try {
    await page.goto(`${BASE_URL}/reports`, { waitUntil: 'networkidle', timeout: 30000 });
    await waitAndScreenshot(page, '18-reports', 4000);
    results.pages.reports = { loaded: true };
  } catch (e) {
    results.pages.reports = { error: e.message };
  }

  // ===== 11. PIPELINE =====
  console.log('--- PIPELINE TEST ---');
  try {
    await page.goto(`${BASE_URL}/pipeline`, { waitUntil: 'networkidle', timeout: 30000 });
    await waitAndScreenshot(page, '19-pipeline', 4000);
    results.pages.pipeline = { loaded: true };
  } catch (e) {
    results.pages.pipeline = { error: e.message };
  }

  // ===== 12. TARGETS =====
  console.log('--- TARGETS TEST ---');
  try {
    await page.goto(`${BASE_URL}/targets`, { waitUntil: 'networkidle', timeout: 30000 });
    await waitAndScreenshot(page, '20-targets', 4000);
    results.pages.targets = { loaded: true };
  } catch (e) {
    results.pages.targets = { error: e.message };
  }

  // ===== 13. TDS =====
  console.log('--- TDS TEST ---');
  try {
    await page.goto(`${BASE_URL}/tds`, { waitUntil: 'networkidle', timeout: 30000 });
    await waitAndScreenshot(page, '21-tds', 4000);
    results.pages.tds = { loaded: true };
  } catch (e) {
    results.pages.tds = { error: e.message };
  }

  // ===== 14. SETTINGS =====
  console.log('--- SETTINGS TEST ---');
  try {
    await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle', timeout: 30000 });
    await waitAndScreenshot(page, '22-settings', 4000);

    const settingsTabs = await page.$$('[role="tab"], button[class*="tab"]');
    const tabTexts = await Promise.all(settingsTabs.map(t => t.textContent()));
    results.pages.settings = { loaded: true, tabs: tabTexts.map(t => t?.trim()).filter(Boolean) };

    // Click through each settings tab
    for (let i = 0; i < settingsTabs.length; i++) {
      try {
        await settingsTabs[i].click();
        await page.waitForTimeout(2000);
        await screenshot(page, `22-settings-tab-${i}`);
      } catch(e) {}
    }
  } catch (e) {
    results.pages.settings = { error: e.message };
  }

  // ===== 15. ONBOARD =====
  console.log('--- ONBOARD TEST ---');
  try {
    await page.goto(`${BASE_URL}/onboard`, { waitUntil: 'networkidle', timeout: 30000 });
    await waitAndScreenshot(page, '23-onboard', 4000);
    results.pages.onboard = { loaded: true };
  } catch (e) {
    results.pages.onboard = { error: e.message };
  }

  // ===== 16. MOBILE VIEWPORT TEST =====
  console.log('--- MOBILE VIEWPORT TEST ---');
  try {
    await page.setViewportSize({ width: 375, height: 812 });

    const mobilePages = ['dashboard', 'clients', 'invoices', 'expenses', 'analytics'];
    for (const mp of mobilePages) {
      await page.goto(`${BASE_URL}/${mp}`, { waitUntil: 'networkidle', timeout: 30000 });
      await waitAndScreenshot(page, `24-mobile-${mp}`, 3000);
    }
    results.functionality.mobileTest = { tested: true, viewport: '375x812' };
  } catch (e) {
    results.functionality.mobileTest = { error: e.message };
  }

  // ===== 17. NAVIGATION COMPLETENESS =====
  console.log('--- NAV COMPLETENESS TEST ---');
  try {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    const allLinks = await page.$$('a[href]');
    const hrefs = await Promise.all(allLinks.map(a => a.getAttribute('href')));
    const internalLinks = hrefs.filter(h => h && (h.startsWith('/') || h.includes('wodo-ally'))).map(h => h);
    results.functionality.navigation = { totalLinks: allLinks.length, internalLinks: [...new Set(internalLinks)] };
  } catch (e) {
    results.functionality.navigation = { error: e.message };
  }

  results.timestamps.end = new Date().toISOString();

  // Write results
  fs.writeFileSync(`${SCREENSHOTS_DIR}/audit-results.json`, JSON.stringify(results, null, 2));
  console.log('\n=== AUDIT COMPLETE ===');
  console.log(JSON.stringify(results, null, 2));

  await browser.close();
})();
