import type { Database } from "./database";

// Re-export table row types for convenience
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Client = Database["public"]["Tables"]["clients"]["Row"];
export type ClientContact = Database["public"]["Tables"]["client_contacts"]["Row"];
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type Invoice = Database["public"]["Tables"]["invoices"]["Row"];
export type InvoiceLineItem = Database["public"]["Tables"]["invoice_line_items"]["Row"];
export type InvoicePayment = Database["public"]["Tables"]["invoice_payments"]["Row"];
export type Contract = Database["public"]["Tables"]["contracts"]["Row"];
export type ExpenseCategory = Database["public"]["Tables"]["expense_categories"]["Row"];
export type ExpenseRule = Database["public"]["Tables"]["expense_rules"]["Row"];
export type BankStatement = Database["public"]["Tables"]["bank_statements"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
export type FinancialTarget = Database["public"]["Tables"]["financial_targets"]["Row"];
export type InvestorReport = Database["public"]["Tables"]["investor_reports"]["Row"];

// Extended types with joins
export type ClientWithContacts = Client & {
  client_contacts: ClientContact[];
};

export type ProjectWithClient = Project & {
  clients: Pick<Client, "id" | "company_name" | "display_name" | "currency">;
};

export type InvoiceWithClient = Invoice & {
  clients: Pick<Client, "id" | "company_name" | "display_name" | "currency">;
  invoice_line_items: InvoiceLineItem[];
};

export type InvoiceWithPayments = InvoiceWithClient & {
  invoice_payments: InvoicePayment[];
};

// UI types
export type InvoiceStatus = Invoice["status"];
export type ProjectStatus = Project["status"];
export type ClientStatus = Client["status"];
export type ContractStatus = Contract["status"];
export type UserRole = Profile["role"];

export type Currency = "INR" | "USD" | "AED" | "GBP" | "EUR";
export type InvoiceType = Invoice["invoice_type"];
export type ProjectType = Project["project_type"];
export type EngagementType = Project["engagement_type"];
