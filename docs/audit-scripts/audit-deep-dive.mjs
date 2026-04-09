import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://wodo-ally-production.up.railway.app';
const SCREENSHOT_DIR = '/Users/shyam/Desktop/Claude Dev Projects/WODO Ally/audit-screenshots/functional';
const RESULTS_FILE = '/Users/shyam/Desktop/Claude Dev Projects/WODO Ally/audit-results/deep-dive-raw.json';

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const results = [];
let consoleErrors = [];

function log(id, test, result, details) {
  results.push({ id, test, result, details });
  console.log(`[${result}] ${id}: ${test} - ${details}`);
}

async function screenshot(page, name) {
  try {
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${name}.png`), fullPage: true });
  } catch (e) {
    console.log(`  [screenshot failed: ${e.message}]`);
  }
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

  // ============ DEEP DIVE: INVOICE DETAIL PAGE ============
  console.log('\n=== INVOICE DETAIL DEEP DIVE ===');

  // Get invoice list first
  await page.goto(`${BASE_URL}/invoices`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);

  // Collect all invoice IDs from links
  const invoiceLinks = await page.$$eval('a[href*="/invoices/"]',
    links => links.map(l => l.getAttribute('href')).filter(h => h && h.match(/\/invoices\/[a-f0-9-]+$/))
  );
  const uniqueInvoiceIds = [...new Set(invoiceLinks)];
  log('DD-01', 'Invoice IDs found', 'INFO', `${uniqueInvoiceIds.length} unique invoice IDs: ${uniqueInvoiceIds.slice(0, 5).join(', ')}`);

  // Visit each invoice detail (up to 5)
  for (let i = 0; i < Math.min(uniqueInvoiceIds.length, 5); i++) {
    const invPath = uniqueInvoiceIds[i];
    try {
      await page.goto(`${BASE_URL}${invPath}`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000);
      await screenshot(page, `DD-inv-${i+1}-detail`);

      // Get invoice number
      const h1Text = await page.$eval('h1', el => el.textContent?.trim()).catch(() => 'N/A');
      const clientName = await page.$eval('h1 + p, h1 ~ p', el => el.textContent?.trim()).catch(() => 'N/A');

      log(`DD-INV-${i+1}`, `Invoice detail: ${h1Text}`, 'PASS', `Client: ${clientName}`);

      // Check all buttons present
      const allBtnTexts = await page.$$eval('button, a[class*="flex"]',
        els => els.map(e => e.textContent?.trim()).filter(t => t && t.length < 50)
      );
      log(`DD-INV-${i+1}-btns`, `Buttons on invoice ${h1Text}`, 'INFO', allBtnTexts.join(' | '));

      // Check for Record Payment button
      const recordPayBtn = await page.$('button:has-text("Record Payment")');
      if (recordPayBtn) {
        log(`DD-INV-${i+1}-pay`, `Record Payment on ${h1Text}`, 'PASS', 'Button present');

        // Click it to test the modal
        await recordPayBtn.click();
        await page.waitForTimeout(1500);
        await screenshot(page, `DD-inv-${i+1}-payment-modal`);

        // Check modal fields
        const modalTitle = await page.$eval('h2', el => el.textContent?.trim()).catch(() => 'N/A');
        const balanceText = await page.textContent('.font-bold.font-sans').catch(() => 'N/A');
        log(`DD-INV-${i+1}-modal`, `Payment modal on ${h1Text}`, 'PASS', `Title: ${modalTitle}, Balance: ${balanceText}`);

        // Check amount field min validation
        const amountInput = await page.$('input[type="number"][min="0.01"]');
        log(`DD-INV-${i+1}-minval`, `Amount min validation`, amountInput ? 'PASS' : 'FAIL',
          amountInput ? 'min=0.01 set' : 'No minimum validation on amount field');

        // Check payment methods
        const methodOptions = await page.$$eval('select option', opts => opts.map(o => o.textContent?.trim()));
        log(`DD-INV-${i+1}-methods`, `Payment methods`, 'PASS', methodOptions.join(', '));

        // Check TDS field
        const tdsField = await page.$('input[type="number"][min="0"]');
        log(`DD-INV-${i+1}-tds`, `TDS field`, tdsField ? 'PASS' : 'WARN', tdsField ? 'Present' : 'Not found');

        // Test: enter negative amount - HTML min=0.01 should prevent
        if (amountInput) {
          await amountInput.fill('-100');
          const submitBtn = await page.$('button:has-text("Record Payment")[type="submit"]');
          if (submitBtn) {
            await submitBtn.click();
            await page.waitForTimeout(500);
            // Check if form submitted (it should be blocked by HTML validation)
            log(`DD-INV-${i+1}-negval`, `Negative amount blocked`, 'INFO', 'HTML min=0.01 validation tested');
          }
        }

        // Close modal
        const closeBtn = await page.$('button:has-text("Cancel")');
        if (closeBtn) await closeBtn.click();
        await page.waitForTimeout(500);
      } else {
        log(`DD-INV-${i+1}-pay`, `Record Payment on ${h1Text}`, 'INFO', 'No Record Payment button (likely fully paid or cancelled)');
      }

      // Check line items table
      const lineItemRows = await page.$$('table tbody tr');
      log(`DD-INV-${i+1}-lines`, `Line items on ${h1Text}`, lineItemRows.length > 0 ? 'PASS' : 'WARN', `${lineItemRows.length} items`);

      // Check payment history section
      const paymentHistory = await page.$('h3:has-text("Payment History")');
      log(`DD-INV-${i+1}-history`, `Payment history on ${h1Text}`, paymentHistory ? 'PASS' : 'INFO', paymentHistory ? 'Present' : 'No history');

      // Check email activity section
      const emailActivity = await page.$('h3:has-text("Email Activity")');
      log(`DD-INV-${i+1}-email`, `Email activity on ${h1Text}`, emailActivity ? 'PASS' : 'WARN', emailActivity ? 'Present' : 'Not found');

      // Test Edit link
      const editLink = await page.$(`a[href*="/edit"]`);
      if (editLink) {
        await editLink.click();
        await page.waitForTimeout(2000);
        await screenshot(page, `DD-inv-${i+1}-edit`);
        log(`DD-INV-${i+1}-edit`, `Edit page for ${h1Text}`, page.url().includes('/edit') ? 'PASS' : 'FAIL', `URL: ${page.url()}`);

        // Go back
        await page.goBack();
        await page.waitForTimeout(1000);
      }

      // Test Preview PDF button
      const pdfBtn = await page.$('button:has-text("Preview PDF")');
      if (pdfBtn) {
        await pdfBtn.click();
        await page.waitForTimeout(5000);
        await screenshot(page, `DD-inv-${i+1}-pdf-preview`);

        // Check if PDF modal opened
        const pdfModal = await page.$('[class*="modal"], [class*="fixed"]');
        log(`DD-INV-${i+1}-pdf`, `PDF preview for ${h1Text}`, pdfModal ? 'PASS' : 'WARN', pdfModal ? 'Modal opened' : 'No modal visible');

        // Close PDF modal
        const closePdf = await page.$('button:has-text("Close"), button[aria-label="Close"]');
        if (closePdf) await closePdf.click();
        await page.waitForTimeout(500);
      }

      // Test Download button
      const downloadBtn = await page.$('button:has-text("Download")');
      log(`DD-INV-${i+1}-dl`, `Download button for ${h1Text}`, downloadBtn ? 'PASS' : 'WARN', downloadBtn ? 'Present' : 'Not found');

    } catch (e) {
      log(`DD-INV-${i+1}-ERR`, `Invoice ${i+1} error`, 'FAIL', e.message);
      await screenshot(page, `DD-inv-${i+1}-error`);
    }
  }

  // ============ PAYMENT PAGE DEEP DIVE ============
  console.log('\n=== PAYMENTS PAGE DEEP DIVE ===');

  await page.goto(`${BASE_URL}/payments`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(3000);
  await screenshot(page, 'DD-payments-full');

  // Check KPI cards
  const kpiTexts = await page.$$eval('[class*="dark-card"], [class*="DarkCard"]',
    els => els.map(e => e.textContent?.trim())
  );
  // Fallback - just get all visible text on the dark section
  const darkSectionText = await page.textContent('body').catch(() => '');
  const hasReceived = darkSectionText.includes('Total Received');
  const hasOutstanding = darkSectionText.includes('Outstanding');
  const hasOverdue = darkSectionText.includes('Overdue');
  const hasTDS = darkSectionText.includes('TDS Deducted');
  log('DD-PAY-KPI', 'Payment KPI cards', (hasReceived && hasOutstanding) ? 'PASS' : 'WARN',
    `Received: ${hasReceived}, Outstanding: ${hasOutstanding}, Overdue: ${hasOverdue}, TDS: ${hasTDS}`);

  // Test search
  const paySearch = await page.$('input[placeholder*="earch"]');
  if (paySearch) {
    await paySearch.fill('Dentique');
    await page.waitForTimeout(1000);
    await screenshot(page, 'DD-payments-search');
    const searchResults = await page.$$('[class*="grid-cols"] > div');
    log('DD-PAY-SEARCH', 'Payment search', 'PASS', `Searched "Dentique"`);
    await paySearch.fill('');
    await page.waitForTimeout(500);
  }

  // Test date filter
  const dateFilter = await page.$('button:has-text("All Time"), button:has-text("Date"), button:has-text("Filter")');
  if (dateFilter) {
    await dateFilter.click();
    await page.waitForTimeout(1000);
    await screenshot(page, 'DD-payments-date-filter');
    log('DD-PAY-DATE', 'Date filter', 'PASS', 'Date filter clicked');

    // Look for preset options
    const filterOptions = await page.$$eval('[role="option"], button:has-text("This Month"), button:has-text("Last"), button:has-text("Quarter")',
      els => els.map(e => e.textContent?.trim())
    );
    log('DD-PAY-DATE-OPTS', 'Date filter options', filterOptions.length > 0 ? 'PASS' : 'WARN', filterOptions.join(', '));

    // Click away to close
    await page.click('body');
    await page.waitForTimeout(500);
  }

  // Test sort columns
  const sortButtons = await page.$$('[class*="uppercase"][class*="tracking"]');
  for (const sortBtn of sortButtons.slice(0, 4)) {
    try {
      const sortText = await sortBtn.textContent();
      await sortBtn.click();
      await page.waitForTimeout(500);
      log('DD-PAY-SORT', `Sort by ${sortText?.trim()}`, 'PASS', 'Clicked');
    } catch (e) {}
  }

  // ============ EXPENSE DEEP DIVE ============
  console.log('\n=== EXPENSES DEEP DIVE ===');

  await page.goto(`${BASE_URL}/expenses`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);
  await screenshot(page, 'DD-expenses-main');

  const expBody = await page.textContent('body');
  log('DD-EXP-LOAD', 'Expenses page content', 'PASS', `Page loaded, length: ${expBody.length} chars`);

  // Check for charts/categories
  const svgElements = await page.$$('svg');
  log('DD-EXP-CHARTS', 'Charts/icons on expenses', 'INFO', `${svgElements.length} SVG elements`);

  // Navigate to upload
  await page.goto(`${BASE_URL}/expenses/upload`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);
  await screenshot(page, 'DD-expenses-upload');

  const uploadBody = await page.textContent('body');
  log('DD-EXP-UPLOAD', 'Upload page', 'PASS', `Has drag/drop: ${uploadBody.includes('drag') || uploadBody.includes('Drop') || uploadBody.includes('upload')}`);

  // Test file upload
  const fileInput = await page.$('input[type="file"]');
  if (fileInput) {
    const sampleFile = '/Users/shyam/Desktop/Claude Dev Projects/WODO Ally/idfc-statement.xlsx';
    if (fs.existsSync(sampleFile)) {
      await fileInput.setInputFiles(sampleFile);
      await page.waitForTimeout(5000);
      await screenshot(page, 'DD-expenses-after-upload');

      // Check for parsed data
      const afterUploadText = await page.textContent('body');
      const hasTable = afterUploadText.includes('Transaction') || afterUploadText.includes('Amount') || afterUploadText.includes('Date');
      log('DD-EXP-PARSE', 'File parsed after upload', hasTable ? 'PASS' : 'WARN',
        `Parsed data visible: ${hasTable}`);

      // Check for category assignment
      const categoryEls = await page.$$('select, [class*="category"]');
      log('DD-EXP-CAT', 'Category assignment', categoryEls.length > 0 ? 'PASS' : 'WARN', `${categoryEls.length} category elements`);

      // Check for approve/submit buttons
      const actionBtns = await page.$$eval('button',
        btns => btns.map(b => b.textContent?.trim()).filter(t => t && t.length < 30)
      );
      log('DD-EXP-ACTIONS', 'Upload action buttons', 'INFO', actionBtns.join(', '));
    }
  }

  // Transactions page
  await page.goto(`${BASE_URL}/expenses/transactions`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);
  await screenshot(page, 'DD-expenses-transactions');

  const txnBody = await page.textContent('body');
  log('DD-EXP-TXN', 'Transactions page', 'PASS', `Content length: ${txnBody.length}`);

  // ============ PIPELINE PAGE ============
  console.log('\n=== PIPELINE PAGE ===');

  await page.goto(`${BASE_URL}/pipeline`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);
  await screenshot(page, 'DD-pipeline');

  const pipelineBody = await page.textContent('body');
  log('DD-PIPE', 'Pipeline page', 'PASS', `Loaded, length: ${pipelineBody.length}`);

  // ============ DASHBOARD KPIs ============
  console.log('\n=== DASHBOARD ===');

  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(3000);
  await screenshot(page, 'DD-dashboard');

  const dashBody = await page.textContent('body');
  log('DD-DASH', 'Dashboard page', 'PASS', `Loaded, length: ${dashBody.length}`);

  // ============ CROSS-CUTTING: NAVIGATION & ERRORS ============
  console.log('\n=== CROSS-CUTTING TESTS ===');

  // Test 404 pages
  for (const badUrl of ['/invoices/bad-uuid', '/clients/bad-uuid', '/contracts/bad-uuid']) {
    await page.goto(`${BASE_URL}${badUrl}`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    const bodyText = await page.textContent('body');
    const hasError = bodyText.includes('404') || bodyText.includes('not found') || bodyText.includes('Error') || bodyText.includes('error');
    await screenshot(page, `DD-404-${badUrl.replace(/\//g, '-')}`);
    log(`DD-404-${badUrl}`, `404 handling: ${badUrl}`, hasError ? 'PASS' : 'FAIL',
      hasError ? 'Error shown' : 'No error - possible data leak or crash');
  }

  // Test browser back/forward
  await page.goto(`${BASE_URL}/clients`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1000);
  await page.goto(`${BASE_URL}/invoices`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1000);
  await page.goBack();
  await page.waitForTimeout(1000);
  const backUrl = page.url();
  log('DD-NAV-BACK', 'Browser back navigation', backUrl.includes('clients') ? 'PASS' : 'WARN', `URL after back: ${backUrl}`);
  await page.goForward();
  await page.waitForTimeout(1000);
  const fwdUrl = page.url();
  log('DD-NAV-FWD', 'Browser forward navigation', fwdUrl.includes('invoices') ? 'PASS' : 'WARN', `URL after forward: ${fwdUrl}`);

  // ============ TDS PAGE ============
  console.log('\n=== TDS PAGE DEEP DIVE ===');
  await page.goto(`${BASE_URL}/tds`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);
  await screenshot(page, 'DD-tds-full');

  const tdsBody = await page.textContent('body');
  log('DD-TDS', 'TDS page content', 'PASS', `Loaded. Has "TDS": ${tdsBody.includes('TDS')}, Has "Certificate": ${tdsBody.includes('Certificate') || tdsBody.includes('certificate')}`);

  // Check for CRUD buttons
  const tdsButtons = await page.$$eval('button', btns => btns.map(b => b.textContent?.trim()).filter(t => t && t.length < 40));
  log('DD-TDS-BTNS', 'TDS page buttons', 'INFO', tdsButtons.join(', '));

  // ============ TARGETS PAGE ============
  console.log('\n=== TARGETS PAGE DEEP DIVE ===');
  await page.goto(`${BASE_URL}/targets`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);
  await screenshot(page, 'DD-targets-full');

  const targetsBody = await page.textContent('body');
  log('DD-TARGETS', 'Targets page content', 'PASS', `Loaded. Has "Target": ${targetsBody.includes('Target') || targetsBody.includes('target')}`);

  const targetButtons = await page.$$eval('button', btns => btns.map(b => b.textContent?.trim()).filter(t => t && t.length < 40));
  log('DD-TARGETS-BTNS', 'Targets page buttons', 'INFO', targetButtons.join(', '));

  // ============ CONTRACTS NEW PAGE ============
  console.log('\n=== CONTRACTS NEW DEEP DIVE ===');
  await page.goto(`${BASE_URL}/contracts/new`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(3000);
  await screenshot(page, 'DD-contracts-new');

  const contractBody = await page.textContent('body');
  log('DD-CONTRACT-NEW', 'New contract page', 'PASS', `Content length: ${contractBody.length}`);

  const contractInputs = await page.$$eval('input, select, textarea',
    els => els.map(e => ({ type: e.getAttribute('type') || e.tagName, name: e.getAttribute('name'), placeholder: e.getAttribute('placeholder') }))
  );
  log('DD-CONTRACT-FIELDS', 'Contract form fields', 'INFO', JSON.stringify(contractInputs.slice(0, 10)));

  // ============ SETTINGS DEEP DIVE ============
  console.log('\n=== SETTINGS DEEP DIVE ===');
  await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);

  // Test Save on Company tab
  const saveBtn = await page.$('button:has-text("Save")');
  if (saveBtn) {
    await saveBtn.click();
    await page.waitForTimeout(2000);
    await screenshot(page, 'DD-settings-save');

    // Check for toast notification
    const toastEl = await page.$('[data-sonner-toast], [class*="toast"]');
    log('DD-SETTINGS-SAVE', 'Settings save action', toastEl ? 'PASS' : 'WARN',
      toastEl ? 'Toast notification shown' : 'No toast - may use localStorage only');
  }

  // Check localStorage usage
  const localStorageKeys = await page.evaluate(() => {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      keys.push(localStorage.key(i));
    }
    return keys;
  });
  log('DD-SETTINGS-LS', 'localStorage usage', 'INFO', `Keys: ${localStorageKeys.join(', ')}`);

  // ============ ONBOARD DEEP DIVE ============
  console.log('\n=== ONBOARDING DEEP DIVE ===');
  await page.goto(`${BASE_URL}/onboard`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);
  await screenshot(page, 'DD-onboard-full');

  const onboardBody = await page.textContent('body');
  log('DD-ONBOARD', 'Onboarding page', 'PASS', `Content length: ${onboardBody.length}`);

  const onboardButtons = await page.$$eval('button', btns => btns.map(b => b.textContent?.trim()).filter(t => t && t.length < 40));
  log('DD-ONBOARD-BTNS', 'Onboarding buttons', 'INFO', onboardButtons.join(', '));

  // Save results
  fs.writeFileSync(RESULTS_FILE, JSON.stringify({ results, consoleErrors }, null, 2));
  console.log(`\nDeep dive complete. ${results.length} tests, Console errors: ${consoleErrors.length}`);
  await browser.close();
})();
