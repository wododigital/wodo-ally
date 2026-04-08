export const COMPANY = {
  name: "WODO Digital Private Limited",
  shortName: "WODO Digital",
  address: "#1, First Floor, Shree Lakshmi Arcade, BDA Layout, Nagarbhavi, Bangalore, India - 560091",
  gstin: "29AADCW8591N1ZA",
  ceo: "Shyam Singh Bhati",
  email: "accounts@wodo.digital",
  phone: "+91 63621 80633",
  website: "www.wodo.digital",
  taglines: [
    "DESIGN | DEVELOPMENT | DIGITAL GROWTH",
    "DESIGN | DEVELOPMENT | ORGANIC GROWTH",
    "DESIGN | DEVELOPMENT | DIGITAL MARKETING | BRANDING",
    "WEB DESIGN | VISUAL IDENTITY | DIGITAL MARKETING",
  ],
} as const;

export const BANK_ACCOUNTS = {
  indian: {
    name: "WODO DIGITAL PRIVATE LIMITED",
    account: "10213871315",
    ifsc: "IDFB0080574",
    swift: "IDFBINBBMUM",
    bank: "IDFC FIRST",
    branch: "KARNATAKA-DEVARAJA URS ROAD BRANCH",
  },
  usa: {
    name: "WODO DIGITAL PRIVATE LIMITED",
    method: "ACH",
    routing: "026073150",
    account: "8335312671",
    bank: "COMMUNITY FEDERAL SAVINGS BANK",
    currency: "USD",
  },
  uae: {
    name: "WODO DIGITAL PRIVATE LIMITED",
    method: "IPP / FTS",
    iban: "AE190960000691060009302",
    bic: "ZANDAEAAXXX",
    bank: "Zand Bank PJSC",
    address: "1st Floor, Emaar Square, Building 6, Dubai, UAE",
    currency: "AED",
  },
  nonGst: {
    name: "Shyam Singh Bhati",
    account: "10221086461",
    ifsc: "IDFB0081105",
    swift: "IDFBINBBMUM",
    bank: "IDFC FIRST",
    branch: "BANGALORE-JP NAGAR 5TH PHASE BRANCH",
    gpay: "9535743993",
  },
} as const;

export const GST_RATE = 18;
export const INVOICE_DUE_DAYS = 7;
export const RETAINER_DUE_DAYS = 7;

export const PROJECT_TYPES = [
  { value: "branding", label: "Branding" },
  { value: "ui_ux_design", label: "UI/UX Design" },
  { value: "web_development", label: "Web Development" },
  { value: "seo", label: "SEO" },
  { value: "google_ads", label: "Google Ads" },
  { value: "social_media", label: "Social Media" },
  { value: "gmb", label: "GMB / Local SEO" },
  { value: "content_marketing", label: "Content Marketing" },
  { value: "full_service", label: "Full Service" },
  { value: "other", label: "Other" },
] as const;

export const CLIENT_REGIONS = [
  { value: "india", label: "India" },
  { value: "usa", label: "USA" },
  { value: "uae", label: "UAE" },
  { value: "uk", label: "UK" },
  { value: "other", label: "Other" },
] as const;

export const CURRENCIES = [
  { value: "INR", label: "INR - Indian Rupee", symbol: "Rs." },
  { value: "USD", label: "USD - US Dollar", symbol: "$" },
  { value: "AED", label: "AED - UAE Dirham", symbol: "AED" },
  { value: "GBP", label: "GBP - British Pound", symbol: "£" },
  { value: "EUR", label: "EUR - Euro", symbol: "€" },
] as const;

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/clients", label: "Clients", icon: "Users" },
  { href: "/projects", label: "Projects", icon: "FolderKanban" },
  { href: "/invoices", label: "Invoices", icon: "FileText" },
  { href: "/contracts", label: "Contracts", icon: "FileSignature" },
  { href: "/payments", label: "Payments", icon: "CreditCard" },
  { separator: true },
  { href: "/expenses", label: "Expenses", icon: "Receipt" },
  { href: "/tds", label: "TDS Certificates", icon: "FileCheck2" },
  { href: "/analytics", label: "Analytics", icon: "BarChart3" },
  { href: "/targets", label: "Targets", icon: "Target" },
  { separator: true },
  { href: "/reports", label: "Investor Reports", icon: "PieChart" },
  { href: "/settings", label: "Settings", icon: "Settings" },
] as const;
