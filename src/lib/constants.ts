export const ACCOUNT_TYPES = [
  { id: "cash", name: "Cash", icon: "Wallet", isDebt: false },
  { id: "investment", name: "Investment", icon: "TrendingUp", isDebt: false },
  { id: "property", name: "Property", icon: "Home", isDebt: false },
  { id: "vehicle", name: "Vehicle", icon: "Car", isDebt: false },
  { id: "creditCard", name: "Credit Card", icon: "CreditCard", isDebt: true },
  { id: "loan", name: "Loan", icon: "Landmark", isDebt: true },
  { id: "otherAsset", name: "Other Asset", icon: "Plus", isDebt: false },
  { id: "otherLiability", name: "Other Liability", icon: "Minus", isDebt: true },
] as const;

export type AccountTypeId = (typeof ACCOUNT_TYPES)[number]["id"];

export const ACCOUNT_SUBTYPES: Record<AccountTypeId, string[]> = {
  cash: ["Checking", "Savings", "HSA", "CD", "Money Market"],
  investment: ["Brokerage", "401(k)", "IRA", "Roth IRA", "Other"],
  property: ["Primary Residence", "Rental", "Land", "Commercial"],
  vehicle: ["Car", "Motorcycle", "Boat", "Other"],
  creditCard: ["Visa", "Mastercard", "Amex", "Other"],
  loan: ["Mortgage", "Auto Loan", "Student Loan", "Personal Loan", "Other"],
  otherAsset: [],
  otherLiability: [],
};

export const DEFAULT_CATEGORIES = [
  { name: "Food & Dining", icon: "UtensilsCrossed", color: "#ef4444", type: "expense" as const },
  { name: "Transportation", icon: "Car", color: "#f97316", type: "expense" as const },
  { name: "Housing", icon: "Home", color: "#eab308", type: "expense" as const },
  { name: "Entertainment", icon: "Film", color: "#84cc16", type: "expense" as const },
  { name: "Shopping", icon: "ShoppingBag", color: "#22c55e", type: "expense" as const },
  { name: "Utilities", icon: "Zap", color: "#14b8a6", type: "expense" as const },
  { name: "Healthcare", icon: "Heart", color: "#06b6d4", type: "expense" as const },
  { name: "Education", icon: "GraduationCap", color: "#3b82f6", type: "expense" as const },
  { name: "Travel", icon: "Plane", color: "#6366f1", type: "expense" as const },
  { name: "Personal Care", icon: "Sparkles", color: "#8b5cf6", type: "expense" as const },
  { name: "Subscriptions", icon: "RefreshCw", color: "#a855f7", type: "expense" as const },
  { name: "Gifts", icon: "Gift", color: "#d946ef", type: "expense" as const },
  { name: "Insurance", icon: "Shield", color: "#ec4899", type: "expense" as const },
  { name: "Salary", icon: "Banknote", color: "#10b981", type: "income" as const },
  { name: "Freelance", icon: "Laptop", color: "#14b8a6", type: "income" as const },
  { name: "Investments", icon: "TrendingUp", color: "#06b6d4", type: "income" as const },
  { name: "Rental Income", icon: "Building", color: "#3b82f6", type: "income" as const },
  { name: "Other Income", icon: "CircleDollarSign", color: "#6366f1", type: "income" as const },
];

export const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "\u20AC", name: "Euro" },
  { code: "GBP", symbol: "\u00A3", name: "British Pound" },
  { code: "INR", symbol: "\u20B9", name: "Indian Rupee" },
  { code: "JPY", symbol: "\u00A5", name: "Japanese Yen" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
  { code: "CNY", symbol: "\u00A5", name: "Chinese Yuan" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona" },
  { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar" },
  { code: "MXN", symbol: "MX$", name: "Mexican Peso" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar" },
  { code: "NOK", symbol: "kr", name: "Norwegian Krone" },
  { code: "KRW", symbol: "\u20A9", name: "South Korean Won" },
  { code: "TRY", symbol: "\u20BA", name: "Turkish Lira" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "ZAR", symbol: "R", name: "South African Rand" },
  { code: "AED", symbol: "AED", name: "UAE Dirham" },
  { code: "THB", symbol: "\u0E3F", name: "Thai Baht" },
  { code: "PLN", symbol: "z\u0142", name: "Polish Zloty" },
] as const;

export const DATE_FORMATS = [
  "MM/dd/yyyy",
  "dd/MM/yyyy",
  "yyyy-MM-dd",
  "dd-MM-yyyy",
  "dd.MM.yyyy",
] as const;

export const TRANSACTION_TYPES = ["income", "expense", "transfer"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const PERIOD_OPTIONS = [
  { label: "7D", value: 7 },
  { label: "30D", value: 30 },
  { label: "90D", value: 90 },
  { label: "1Y", value: 365 },
  { label: "All", value: -1 },
] as const;
