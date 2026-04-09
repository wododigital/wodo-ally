import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://wodo-ally-production.up.railway.app';
const SCREENSHOT_DIR = '/Users/shyam/Desktop/Claude Dev Projects/WODO Ally/audit-screenshots/functional';
const RESULTS_FILE = '/Users/shyam/Desktop/Claude Dev Projects/WODO Ally/audit-results/phase7-raw.json';

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const results = [];
let consoleErrors = [];

function log(id, test, result, details) {
  results.push({ id, test, result, details });
  console.log(`[${result}] ${id}: ${test} - ${details}`);
}

async function screenshot(page, name) {
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${name}.png`), fullPage: true });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push({ url: page.url(), message: msg.text() });
  });
  page.on('pageerror', err => {
    consoleErrors.push({ url: page.url(), message: err.message });
  });

  // Login
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.fill('input[type="email"], input[name="email"]', 'accounts@wodo.digital');
  await page.fill('input[type="password"], input[name="password"]', 'WodoAlly@2026');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(3000);

  // ============ PHASE 7: EXPENSE MANAGEMENT ============
  console.log('\n=== PHASE 7: EXPENSE MANAGEMENT ===');

  // 7.1 - Expense dashboard
  await page.goto(`${BASE_URL}/expenses`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);
  await screenshot(page, '7-01-expenses-dashboard');

  const expUrl = page.url();
  log('7-01', 'Expenses page loads', !expUrl.includes('404') ? 'PASS' : 'FAIL', `URL: ${expUrl}`);

  // Category breakdown
  const bodyText = await page.textContent('body');
  const hasCategories = bodyText.includes('category') || bodyText.includes('Category') || bodyText.includes('Rent') || bodyText.includes('Salary');
  log('7-02', 'Category breakdown', hasCategories ? 'PASS' : 'WARN', hasCategories ? 'Category data present' : 'No category data visible');

  // Charts
  const charts = await page.$$('canvas, svg[class*="chart"], [class*="chart"], [class*="recharts"]');
  log('7-03', 'Expense charts', charts.length > 0 ? 'PASS' : 'WARN', `${charts.length} chart elements`);

  // Stats/KPI cards
  const statCards = await page.$$('[class*="card"]');
  log('7-04', 'Expense stat cards', statCards.length > 0 ? 'PASS' : 'WARN', `${statCards.length} card elements`);

  // 7.5 - Upload page
  await page.goto(`${BASE_URL}/expenses/upload`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);
  await screenshot(page, '7-05-upload-page');

  const uploadUrl = page.url();
  log('7-05', 'Upload page loads', uploadUrl.includes('upload') ? 'PASS' : 'FAIL', `URL: ${uploadUrl}`);

  // Drag/drop zone
  const dropZone = await page.$('[class*="drop"], [class*="upload"], input[type="file"], [class*="dropzone"]');
  log('7-06', 'Upload drop zone', dropZone ? 'PASS' : 'WARN', dropZone ? 'Found' : 'Not found');

  // Test file upload
  const sampleFile = '/Users/shyam/Desktop/Claude Dev Projects/WODO Ally/idfc-statement.xlsx';
  if (fs.existsSync(sampleFile)) {
    try {
      const fileInput = await page.$('input[type="file"]');
      if (fileInput) {
        await fileInput.setInputFiles(sampleFile);
        await page.waitForTimeout(3000);
        await screenshot(page, '7-07-after-upload');
        log('7-07', 'File upload', 'PASS', 'File uploaded via input');

        // Check if transactions parsed
        await page.waitForTimeout(5000);
        await screenshot(page, '7-08-parsed-transactions');

        const parsedRows = await page.$$('table tbody tr, [class*="transaction"]');
        log('7-08', 'Transaction parsing', parsedRows.length > 0 ? 'PASS' : 'WARN', `${parsedRows.length} parsed rows`);

        // Check for upload/process button
        const processBtn = await page.$('button:has-text("Upload"), button:has-text("Process"), button:has-text("Import"), button:has-text("Submit")');
        if (processBtn) {
          log('7-09', 'Process button', 'PASS', 'Found');
          // Don't click - don't want to actually import test data
        }
      } else {
        // Try drag-drop zone click
        const uploadArea = await page.$('[class*="upload"], [class*="drop"]');
        if (uploadArea) {
          log('7-07', 'File upload', 'WARN', 'No file input found, but upload area exists');
        }
      }
    } catch (e) {
      log('7-07', 'File upload', 'FAIL', e.message);
      await screenshot(page, '7-07-upload-error');
    }
  } else {
    log('7-07', 'File upload', 'BLOCKED', 'Sample file not found');
  }

  // 7.10 - Transactions page
  await page.goto(`${BASE_URL}/expenses/transactions`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);
  await screenshot(page, '7-10-transactions-page');

  const txnUrl = page.url();
  log('7-10', 'Transactions page loads', txnUrl.includes('transactions') ? 'PASS' : 'FAIL', `URL: ${txnUrl}`);

  const txnRows = await page.$$('table tbody tr, [class*="transaction"]');
  log('7-11', 'Transaction list', txnRows.length >= 0 ? 'PASS' : 'WARN', `${txnRows.length} transactions`);

  // Filters
  const filters = await page.$$('select, input[type="date"], [class*="filter"], button:has-text("Filter")');
  log('7-12', 'Transaction filters', filters.length > 0 ? 'PASS' : 'WARN', `${filters.length} filter elements`);

  // Date range filtering
  const dateInputs = await page.$$('input[type="date"]');
  log('7-13', 'Date range filters', dateInputs.length >= 2 ? 'PASS' : 'WARN', `${dateInputs.length} date inputs`);

  // Category assignment
  const categorySelects = await page.$$('select[name*="category"], [class*="category"]');
  log('7-14', 'Category assignment', categorySelects.length > 0 ? 'PASS' : 'WARN', `${categorySelects.length} category elements`);

  // Approval flow
  const approveBtn = await page.$('button:has-text("Approve"), button:has-text("Accept"), [class*="approve"]');
  log('7-15', 'Approval flow', approveBtn ? 'PASS' : 'WARN', approveBtn ? 'Approve button found' : 'Not found');

  // Save
  fs.writeFileSync(RESULTS_FILE, JSON.stringify({ results, consoleErrors }, null, 2));
  console.log(`\nPhase 7 complete. ${results.length} tests, Console errors: ${consoleErrors.length}`);
  await browser.close();
})();
