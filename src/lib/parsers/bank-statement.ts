import * as XLSX from "xlsx";

export interface ParsedTransaction {
  transaction_date: string; // YYYY-MM-DD
  value_date: string | null;
  particulars: string;
  cheque_number: string | null;
  debit: number | null;
  credit: number | null;
  balance: number | null;
}

export interface ParsedStatement {
  bank_name: string;
  account_number: string | null;
  statement_period_start: string | null;
  statement_period_end: string | null;
  opening_balance: number | null;
  closing_balance: number | null;
  total_debit: number;
  total_credit: number;
  transactions: ParsedTransaction[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Convert DD/MM/YYYY or DD-MM-YYYY to YYYY-MM-DD.
 * Returns null if unparseable.
 */
function convertDate(raw: unknown): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();

  // Handle Excel serial date numbers
  if (/^\d+$/.test(s)) {
    const serial = parseInt(s, 10);
    if (serial > 1000) {
      // Excel serial date: days since 1900-01-00 (with leap year bug)
      const excelEpoch = new Date(1899, 11, 30);
      const date = new Date(excelEpoch.getTime() + serial * 86400000);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const match = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (match) {
    const dd = match[1].padStart(2, "0");
    const mm = match[2].padStart(2, "0");
    const yyyy = match[3];
    return `${yyyy}-${mm}-${dd}`;
  }

  // DD-MMM-YYYY (e.g. "01-Feb-2026", "15-Jan-2025")
  const MONTHS: Record<string, string> = {
    jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
    jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
  };
  const namedMatch = s.match(/^(\d{1,2})[\/\-]([A-Za-z]{3})[\/\-](\d{4})$/);
  if (namedMatch) {
    const dd = namedMatch[1].padStart(2, "0");
    const mm = MONTHS[namedMatch[2].toLowerCase()];
    const yyyy = namedMatch[3];
    if (mm) return `${yyyy}-${mm}-${dd}`;
  }

  // Try ISO format that might already be present
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  return null;
}

/**
 * Parse an amount cell: strip commas, spaces, return float or null.
 */
function parseAmount(raw: unknown): number | null {
  if (raw == null || raw === "" || raw === "-") return null;
  const s = String(raw).replace(/,/g, "").trim();
  if (s === "" || s === "-") return null;
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

/**
 * Normalize a header string for comparison.
 */
function normalizeHeader(s: unknown): string {
  return String(s ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Search for account number in header rows. Tries common IDFC patterns.
 */
function extractAccountNumber(rows: unknown[][]): string | null {
  for (const row of rows) {
    for (const cell of row) {
      const s = String(cell ?? "");
      // "Account Number: XXXXXXX" or "A/C No: ..."
      const m = s.match(/(?:account\s*(?:number|no\.?|#)\s*[:\-]?\s*)(\d[\d\s]{6,18}\d)/i);
      if (m) return m[1].replace(/\s+/g, "");
      // standalone 9-18 digit number that looks like account number
      const standalone = s.match(/^(\d{9,18})$/);
      if (standalone) return standalone[1];
    }
  }
  return null;
}

/**
 * Extract opening balance from header rows.
 */
function extractOpeningBalance(rows: unknown[][]): number | null {
  for (const row of rows) {
    for (let c = 0; c < row.length; c++) {
      const cell = String(row[c] ?? "").toLowerCase();
      if (cell.includes("opening balance") || cell.includes("opening bal")) {
        // Check adjacent cells for the amount
        for (let offset = 1; offset <= 3; offset++) {
          const amt = parseAmount(row[c + offset]);
          if (amt !== null) return amt;
        }
      }
    }
  }
  return null;
}

// ─── Main parser ──────────────────────────────────────────────────────────────

export function parseIDFCStatement(file: File): Promise<ParsedStatement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: false });

        // Use first sheet
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) throw new Error("No sheets found in workbook");

        const sheet = workbook.Sheets[sheetName];
        // Convert to array of arrays for easy scanning
        const rawData: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: null,
          raw: true,
        }) as unknown[][];

        // ── Find opening/closing balance from IDFC summary row ───────────────
        // IDFC has a summary row: ["Opening Balance","Total Debit","Total Credit","Closing Balance"]
        // followed by the values row. Find and extract.
        let idfc_opening: number | null = null;
        let idfc_closing: number | null = null;
        for (let r = 0; r < rawData.length; r++) {
          const row = rawData[r];
          const labels = row.map((c) => normalizeHeader(c));
          if (labels.includes("opening balance") && labels.includes("closing balance")) {
            // Values are in the next row
            const nextRow = rawData[r + 1];
            if (nextRow) {
              const obIdx = labels.indexOf("opening balance");
              const cbIdx = labels.indexOf("closing balance");
              idfc_opening = parseAmount(nextRow[obIdx]);
              idfc_closing = parseAmount(nextRow[cbIdx]);
            }
            break;
          }
        }

        // ── Find the header row ──────────────────────────────────────────────
        // Look for the row containing "Transaction Date" or "Txn Date"
        let headerRowIdx = -1;
        let colMap: {
          txn_date: number;
          value_date: number;
          particulars: number;
          cheque: number;
          debit: number;
          credit: number;
          balance: number;
        } = { txn_date: -1, value_date: -1, particulars: -1, cheque: -1, debit: -1, credit: -1, balance: -1 };

        for (let r = 0; r < rawData.length; r++) {
          const row = rawData[r];
          let foundTxnDate = false;
          let foundParticulars = false;

          const candidate = {
            txn_date: -1,
            value_date: -1,
            particulars: -1,
            cheque: -1,
            debit: -1,
            credit: -1,
            balance: -1,
          };

          for (let c = 0; c < row.length; c++) {
            const h = normalizeHeader(row[c]);
            if (h === "transaction date" || h === "txn date" || h === "date") {
              candidate.txn_date = c;
              foundTxnDate = true;
            } else if (h === "value date" || h === "val date") {
              candidate.value_date = c;
            } else if (h === "particulars" || h === "description" || h === "narration") {
              candidate.particulars = c;
              foundParticulars = true;
            } else if (h === "cheque number" || h === "chq / ref no." || h === "cheque no" || h === "chq no" || h === "ref no" || h === "chq/ref no") {
              candidate.cheque = c;
            } else if (h === "debit" || h === "withdrawal (dr.)" || h === "withdrawal" || h === "dr") {
              candidate.debit = c;
            } else if (h === "credit" || h === "deposit (cr.)" || h === "deposit" || h === "cr") {
              candidate.credit = c;
            } else if (h === "balance" || h === "running balance") {
              candidate.balance = c;
            }
          }

          if (foundTxnDate && foundParticulars) {
            headerRowIdx = r;
            colMap = candidate;
            break;
          }
        }

        if (headerRowIdx === -1) {
          throw new Error(
            "Could not find transaction table headers. Expected columns: Transaction Date, Particulars, Debit, Credit, Balance"
          );
        }

        // ── Extract metadata from rows before the header ─────────────────────
        const preHeaderRows = rawData.slice(0, headerRowIdx);
        const accountNumber = extractAccountNumber(preHeaderRows);
        const openingBalance = extractOpeningBalance(preHeaderRows);

        // Try to find statement period from pre-header rows
        let periodStart: string | null = null;
        let periodEnd: string | null = null;

        for (const row of preHeaderRows) {
          for (const cell of row) {
            const s = String(cell ?? "");
            // "01-Feb-2026 TO 28-Feb-2026" or "01/01/2026 to 28/02/2026"
            const range = s.match(
              /(\d{1,2}[\/\-][A-Za-z0-9]{2,3}[\/\-]\d{4})\s*(?:to|[-])\s*(\d{1,2}[\/\-][A-Za-z0-9]{2,3}[\/\-]\d{4})/i
            );
            if (range) {
              periodStart = convertDate(range[1]);
              periodEnd = convertDate(range[2]);
            }
          }
        }

        // ── Parse transaction rows ────────────────────────────────────────────
        const transactions: ParsedTransaction[] = [];

        for (let r = headerRowIdx + 1; r < rawData.length; r++) {
          const row = rawData[r];

          // Skip rows where txn_date cell is empty or non-date-like
          const rawDate = row[colMap.txn_date];
          if (rawDate == null || String(rawDate).trim() === "") continue;

          const txnDate = convertDate(rawDate);
          if (!txnDate) continue;

          const particulars = String(row[colMap.particulars] ?? "").trim();
          if (!particulars) continue;

          const debit = parseAmount(colMap.debit >= 0 ? row[colMap.debit] : null);
          const credit = parseAmount(colMap.credit >= 0 ? row[colMap.credit] : null);
          const balance = parseAmount(colMap.balance >= 0 ? row[colMap.balance] : null);
          const valueDate = colMap.value_date >= 0 ? convertDate(row[colMap.value_date]) : null;
          const cheque =
            colMap.cheque >= 0 && row[colMap.cheque] != null
              ? String(row[colMap.cheque]).trim() || null
              : null;

          transactions.push({
            transaction_date: txnDate,
            value_date: valueDate,
            particulars,
            cheque_number: cheque,
            debit,
            credit,
            balance,
          });
        }

        if (transactions.length === 0) {
          throw new Error("No transactions found in the file. Please check the format.");
        }

        // ── Compute totals ────────────────────────────────────────────────────
        const totalDebit = transactions.reduce((s, t) => s + (t.debit ?? 0), 0);
        const totalCredit = transactions.reduce((s, t) => s + (t.credit ?? 0), 0);

        // Derive period from transactions if not found in headers
        if (!periodStart || !periodEnd) {
          const dates = transactions
            .map((t) => t.transaction_date)
            .filter(Boolean)
            .sort();
          if (dates.length > 0) {
            periodStart = dates[0];
            periodEnd = dates[dates.length - 1];
          }
        }

        // Closing balance: last non-null balance in transactions
        let closingBalance: number | null = null;
        for (let i = transactions.length - 1; i >= 0; i--) {
          if (transactions[i].balance != null) {
            closingBalance = transactions[i].balance;
            break;
          }
        }

        resolve({
          bank_name: "IDFC FIRST Bank",
          account_number: accountNumber,
          statement_period_start: periodStart,
          statement_period_end: periodEnd,
          opening_balance: idfc_opening ?? openingBalance,
          closing_balance: idfc_closing ?? closingBalance,
          total_debit: Math.round(totalDebit * 100) / 100,
          total_credit: Math.round(totalCredit * 100) / 100,
          transactions,
        });
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}
