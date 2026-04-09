#!/usr/bin/env npx tsx
/**
 * WODO Ally E2E Audit Report Generator
 * Reads Playwright JSON results and produces an HTML report.
 */

import * as fs from "fs";
import * as path from "path";

interface PlaywrightResult {
  config: any;
  suites: Suite[];
  stats: {
    startTime: string;
    duration: number;
    expected: number;
    unexpected: number;
    flaky: number;
    skipped: number;
  };
}

interface Suite {
  title: string;
  file: string;
  suites: Suite[];
  specs: Spec[];
}

interface Spec {
  title: string;
  ok: boolean;
  tests: TestResult[];
}

interface TestResult {
  timeout: number;
  annotations: any[];
  expectedStatus: string;
  projectName: string;
  results: {
    workerIndex: number;
    status: string;
    duration: number;
    errors: { message: string; stack?: string }[];
    attachments: { name: string; path?: string; contentType: string }[];
  }[];
  status: string;
}

// ─── Read results ────────────────────────────────────────────────────────────
const resultsPath = path.join(__dirname, "reports", "results.json");
if (!fs.existsSync(resultsPath)) {
  console.error("No results.json found. Run the tests first.");
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(resultsPath, "utf-8")) as PlaywrightResult;

// ─── Flatten results ─────────────────────────────────────────────────────────
interface FlatTest {
  suite: string;
  file: string;
  name: string;
  status: "passed" | "failed" | "skipped" | "timedOut";
  duration: number;
  error?: string;
}

function flattenSuites(suites: Suite[] | undefined, parentTitle = ""): FlatTest[] {
  if (!suites || !Array.isArray(suites)) return [];
  const tests: FlatTest[] = [];
  for (const suite of suites) {
    const title = parentTitle ? `${parentTitle} > ${suite.title}` : suite.title;
    for (const spec of (suite.specs ?? [])) {
      for (const t of (spec.tests ?? [])) {
        const result = t.results?.[0];
        tests.push({
          suite: title,
          file: suite.file,
          name: spec.title,
          status: (result?.status as any) ?? "skipped",
          duration: result?.duration ?? 0,
          error: result?.errors?.[0]?.message,
        });
      }
    }
    tests.push(...flattenSuites(suite.suites, title));
  }
  return tests;
}

const allTests = flattenSuites(raw.suites);

// ─── Aggregate stats ─────────────────────────────────────────────────────────
const passed = allTests.filter((t) => t.status === "passed").length;
const failed = allTests.filter((t) => t.status === "failed").length;
const skipped = allTests.filter((t) => t.status === "skipped").length;
const timedOut = allTests.filter((t) => t.status === "timedOut").length;
const total = allTests.length;
const totalDuration = allTests.reduce((s, t) => s + t.duration, 0);
const healthScore = total > 0 ? Math.round((passed / total) * 100) : 0;

// ─── Group by suite ──────────────────────────────────────────────────────────
const suiteMap = new Map<string, FlatTest[]>();
for (const t of allTests) {
  const key = t.suite || t.file;
  if (!suiteMap.has(key)) suiteMap.set(key, []);
  suiteMap.get(key)!.push(t);
}

// ─── Category mapping ────────────────────────────────────────────────────────
function getCategory(file: string): string {
  if (file.includes("01-login") || file.includes("20-security")) return "Auth & Security";
  if (file.includes("02-dashboard")) return "Dashboard";
  if (file.includes("03-clients") || file.includes("04-client") || file.includes("05-client")) return "Client Management";
  if (file.includes("06-invoice") || file.includes("07-invoice") || file.includes("08-invoice") || file.includes("09-invoice") || file.includes("10-invoice")) return "Invoice & Calculations";
  if (file.includes("11-payment")) return "Payments";
  if (file.includes("12-expense")) return "Expenses";
  if (file.includes("13-analytics")) return "Analytics";
  if (file.includes("14-settings")) return "Settings";
  if (file.includes("15-contracts")) return "Contracts & Pipeline";
  if (file.includes("16-tds")) return "TDS & Reports";
  if (file.includes("17-navigation")) return "Navigation & Responsive";
  if (file.includes("18-form")) return "Form Validation";
  if (file.includes("19-data")) return "Data Persistence";
  return "Other";
}

const categoryStats = new Map<string, { passed: number; failed: number; total: number }>();
for (const t of allTests) {
  const cat = getCategory(t.file);
  if (!categoryStats.has(cat)) categoryStats.set(cat, { passed: 0, failed: 0, total: 0 });
  const s = categoryStats.get(cat)!;
  s.total++;
  if (t.status === "passed") s.passed++;
  else s.failed++;
}

// ─── Generate HTML ───────────────────────────────────────────────────────────
const now = new Date().toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" });

function statusIcon(status: string) {
  switch (status) {
    case "passed": return '<span class="icon pass">&#10004;</span>';
    case "failed": return '<span class="icon fail">&#10008;</span>';
    case "timedOut": return '<span class="icon warn">&#9888;</span>';
    default: return '<span class="icon skip">&#9711;</span>';
  }
}

function statusClass(status: string) {
  if (status === "passed") return "pass";
  if (status === "failed") return "fail";
  if (status === "timedOut") return "warn";
  return "skip";
}

function escapeHtml(str: string) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const categoryRows = Array.from(categoryStats.entries())
  .map(([cat, s]) => {
    const pct = Math.round((s.passed / s.total) * 100);
    const color = pct >= 90 ? "#16a34a" : pct >= 70 ? "#f59e0b" : "#ef4444";
    return `
      <tr>
        <td><strong>${cat}</strong></td>
        <td>${s.passed}</td>
        <td>${s.failed}</td>
        <td>${s.total}</td>
        <td>
          <div class="bar-bg"><div class="bar-fill" style="width:${pct}%;background:${color}"></div></div>
          <span style="color:${color};font-weight:600">${pct}%</span>
        </td>
      </tr>`;
  })
  .join("");

const suiteBlocks = Array.from(suiteMap.entries())
  .map(([suite, tests]) => {
    const suitePass = tests.filter((t) => t.status === "passed").length;
    const suitePct = Math.round((suitePass / tests.length) * 100);
    const rows = tests
      .map(
        (t) => `
        <tr class="test-row ${statusClass(t.status)}">
          <td>${statusIcon(t.status)}</td>
          <td>${escapeHtml(t.name)}</td>
          <td class="mono">${t.duration}ms</td>
          <td>${t.error ? `<details><summary class="err-summary">Error</summary><pre class="err-detail">${escapeHtml(t.error.substring(0, 500))}</pre></details>` : "-"}</td>
        </tr>`
      )
      .join("");

    return `
      <div class="suite-block">
        <div class="suite-header" onclick="this.parentElement.classList.toggle('collapsed')">
          <span class="suite-title">${escapeHtml(suite)}</span>
          <span class="suite-stats">${suitePass}/${tests.length} passed (${suitePct}%)</span>
        </div>
        <table class="test-table">
          <thead><tr><th width="40"></th><th>Test</th><th width="80">Time</th><th width="200">Error</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  })
  .join("");

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>WODO Ally - E2E Audit Report</title>
<style>
  :root {
    --bg: #0a0a0f;
    --card: #12121a;
    --card-border: rgba(255,255,255,0.06);
    --text: #e4e4e7;
    --text-muted: #71717a;
    --accent: #fd7e14;
    --pass: #16a34a;
    --fail: #ef4444;
    --warn: #f59e0b;
    --skip: #6b7280;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.6;
    padding: 0;
  }
  .header {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    padding: 48px 40px;
    border-bottom: 1px solid var(--card-border);
  }
  .header h1 {
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 4px;
  }
  .header h1 span { color: var(--accent); }
  .header .subtitle {
    color: var(--text-muted);
    font-size: 14px;
  }
  .header .meta {
    margin-top: 12px;
    display: flex;
    gap: 24px;
    font-size: 13px;
    color: var(--text-muted);
  }
  .container { max-width: 1200px; margin: 0 auto; padding: 32px 40px; }

  /* Score ring */
  .score-section {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: 40px;
    margin-bottom: 40px;
    align-items: center;
  }
  .score-ring {
    width: 180px;
    height: 180px;
    position: relative;
  }
  .score-ring svg { transform: rotate(-90deg); }
  .score-ring .value {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .score-ring .value .num {
    font-size: 48px;
    font-weight: 800;
    line-height: 1;
  }
  .score-ring .value .label {
    font-size: 12px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-top: 4px;
  }

  /* KPI cards */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }
  .kpi {
    background: var(--card);
    border: 1px solid var(--card-border);
    border-radius: 16px;
    padding: 20px;
  }
  .kpi .num {
    font-size: 32px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  .kpi .label {
    font-size: 12px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-top: 4px;
  }
  .kpi.pass .num { color: var(--pass); }
  .kpi.fail .num { color: var(--fail); }
  .kpi.total .num { color: var(--accent); }
  .kpi.time .num { color: #8b5cf6; }

  /* Category table */
  .section-title {
    font-size: 18px;
    font-weight: 700;
    margin: 40px 0 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--card-border);
  }
  .cat-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 32px;
  }
  .cat-table th {
    text-align: left;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text-muted);
    padding: 10px 12px;
    border-bottom: 1px solid var(--card-border);
  }
  .cat-table td {
    padding: 12px;
    border-bottom: 1px solid rgba(255,255,255,0.03);
    font-size: 14px;
  }
  .bar-bg {
    display: inline-block;
    width: 100px;
    height: 6px;
    background: rgba(255,255,255,0.06);
    border-radius: 3px;
    overflow: hidden;
    vertical-align: middle;
    margin-right: 8px;
  }
  .bar-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.5s ease;
  }

  /* Suite blocks */
  .suite-block {
    background: var(--card);
    border: 1px solid var(--card-border);
    border-radius: 12px;
    margin-bottom: 12px;
    overflow: hidden;
  }
  .suite-block.collapsed .test-table { display: none; }
  .suite-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 20px;
    cursor: pointer;
    user-select: none;
    transition: background 0.15s;
  }
  .suite-header:hover { background: rgba(255,255,255,0.02); }
  .suite-title {
    font-size: 14px;
    font-weight: 600;
  }
  .suite-stats {
    font-size: 13px;
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
  }
  .test-table {
    width: 100%;
    border-collapse: collapse;
  }
  .test-table thead th {
    text-align: left;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text-muted);
    padding: 8px 16px;
    background: rgba(0,0,0,0.2);
    border-top: 1px solid var(--card-border);
  }
  .test-table tbody td {
    padding: 10px 16px;
    font-size: 13px;
    border-bottom: 1px solid rgba(255,255,255,0.02);
  }
  .icon {
    display: inline-flex;
    width: 20px;
    height: 20px;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: 12px;
  }
  .icon.pass { background: rgba(22,163,106,0.15); color: var(--pass); }
  .icon.fail { background: rgba(239,68,68,0.15); color: var(--fail); }
  .icon.warn { background: rgba(245,158,11,0.15); color: var(--warn); }
  .icon.skip { background: rgba(107,114,128,0.15); color: var(--skip); }
  .mono { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 12px; color: var(--text-muted); }
  .err-summary {
    cursor: pointer;
    color: var(--fail);
    font-size: 12px;
  }
  .err-detail {
    margin-top: 8px;
    padding: 10px;
    background: rgba(239,68,68,0.06);
    border: 1px solid rgba(239,68,68,0.15);
    border-radius: 8px;
    font-size: 11px;
    color: #fca5a5;
    overflow-x: auto;
    max-height: 200px;
    white-space: pre-wrap;
    word-break: break-all;
  }

  /* Footer */
  .footer {
    text-align: center;
    padding: 32px;
    color: var(--text-muted);
    font-size: 12px;
    border-top: 1px solid var(--card-border);
    margin-top: 40px;
  }

  /* Test data section */
  .test-data {
    background: var(--card);
    border: 1px solid var(--card-border);
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 32px;
  }
  .test-data h3 { font-size: 14px; margin-bottom: 12px; color: var(--accent); }
  .test-data table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .test-data th { text-align: left; padding: 6px 8px; color: var(--text-muted); font-size: 11px; text-transform: uppercase; }
  .test-data td { padding: 6px 8px; }
  .test-data .calc { color: var(--accent); font-weight: 600; font-family: monospace; }
</style>
</head>
<body>

<div class="header">
  <h1>WODO <span>Ally</span> - E2E Audit Report</h1>
  <p class="subtitle">Comprehensive product audit using Playwright + Chromium</p>
  <div class="meta">
    <span>Generated: ${now}</span>
    <span>Browser: Chromium</span>
    <span>Parallel Workers: 5</span>
    <span>Total Duration: ${(totalDuration / 1000).toFixed(1)}s</span>
  </div>
</div>

<div class="container">
  <!-- Health Score + KPIs -->
  <div class="score-section">
    <div class="score-ring">
      <svg width="180" height="180" viewBox="0 0 180 180">
        <circle cx="90" cy="90" r="80" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="10"/>
        <circle cx="90" cy="90" r="80" fill="none"
          stroke="${healthScore >= 80 ? "var(--pass)" : healthScore >= 60 ? "var(--warn)" : "var(--fail)"}"
          stroke-width="10"
          stroke-dasharray="${2 * Math.PI * 80}"
          stroke-dashoffset="${2 * Math.PI * 80 * (1 - healthScore / 100)}"
          stroke-linecap="round"/>
      </svg>
      <div class="value">
        <div class="num" style="color:${healthScore >= 80 ? "var(--pass)" : healthScore >= 60 ? "var(--warn)" : "var(--fail)"}">${healthScore}</div>
        <div class="label">Health Score</div>
      </div>
    </div>
    <div class="kpi-grid">
      <div class="kpi pass"><div class="num">${passed}</div><div class="label">Passed</div></div>
      <div class="kpi fail"><div class="num">${failed}</div><div class="label">Failed</div></div>
      <div class="kpi total"><div class="num">${total}</div><div class="label">Total Tests</div></div>
      <div class="kpi time"><div class="num">${(totalDuration / 1000).toFixed(1)}s</div><div class="label">Duration</div></div>
    </div>
  </div>

  <!-- Test Data Used -->
  <div class="test-data">
    <h3>Test Data & Expected Calculations</h3>
    <table>
      <thead><tr><th>Scenario</th><th>Input</th><th>Expected Output</th></tr></thead>
      <tbody>
        <tr>
          <td>GST Invoice</td>
          <td>Website Design (1x50,000) + SEO Setup (2x15,000)</td>
          <td><span class="calc">Subtotal: 80,000 | GST 18%: 14,400 | Total: 94,400</span></td>
        </tr>
        <tr>
          <td>International Invoice</td>
          <td>Full Stack Dev (1x$5,000) + QA Testing (3x$1,200)</td>
          <td><span class="calc">Subtotal: $8,600 | Tax: $0 | Total: $8,600</span></td>
        </tr>
        <tr>
          <td>Non-GST Invoice</td>
          <td>Branding Package (1x25,000)</td>
          <td><span class="calc">Subtotal: 25,000 | Tax: 0 | Total: 25,000</span></td>
        </tr>
        <tr>
          <td>Payment (Full)</td>
          <td>Bank Transfer Rs.94,400, TDS: 0</td>
          <td><span class="calc">Balance Due: 0</span></td>
        </tr>
        <tr>
          <td>Payment (with TDS)</td>
          <td>Bank Transfer Rs.80,000, TDS: Rs.8,000</td>
          <td><span class="calc">Received: 80,000 | TDS Deducted: 8,000</span></td>
        </tr>
        <tr>
          <td>GST Client</td>
          <td>Audit Test GST Pvt Ltd, GSTIN: 29AABCT1332L1ZD, Bangalore</td>
          <td><span class="calc">Type: indian_gst | Currency: INR | GSTIN visible</span></td>
        </tr>
        <tr>
          <td>Intl Client</td>
          <td>Audit Test Intl Corp, New York, USA</td>
          <td><span class="calc">Type: international | Currency: USD | No GSTIN field</span></td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Category breakdown -->
  <h2 class="section-title">Category Breakdown</h2>
  <table class="cat-table">
    <thead><tr><th>Category</th><th>Passed</th><th>Failed</th><th>Total</th><th>Score</th></tr></thead>
    <tbody>${categoryRows}</tbody>
  </table>

  <!-- Detailed results -->
  <h2 class="section-title">Detailed Test Results</h2>
  ${suiteBlocks}
</div>

<div class="footer">
  <p>WODO Ally E2E Audit | SPARC Multi-Agent Orchestration | Playwright + Chromium</p>
  <p style="margin-top:4px">WODO Digital Private Limited &copy; ${new Date().getFullYear()}</p>
</div>

</body>
</html>`;

// ─── Write report ────────────────────────────────────────────────────────────
const reportPath = path.join(__dirname, "reports", "audit-report.html");
fs.writeFileSync(reportPath, html, "utf-8");
console.log(`\nReport generated: ${reportPath}`);
console.log(`Health Score: ${healthScore}% | ${passed}/${total} passed | ${failed} failed | ${(totalDuration / 1000).toFixed(1)}s`);
