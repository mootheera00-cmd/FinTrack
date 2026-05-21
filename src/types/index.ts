// ─── Domain Types mirroring the Supabase schema ───────────────

export type TransactionType = 'income' | 'expense';

export type TransactionCategory =
  | 'salary' | 'freelance' | 'investment' | 'other_income'
  | 'food' | 'transport' | 'shopping' | 'entertainment'
  | 'utilities' | 'health' | 'education' | 'travel' | 'other_expense';

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  currency: string;
  monthly_income: number;
  liquid_cash: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  note: string | null;
  txn_date: string;   // ISO date string "YYYY-MM-DD"
  created_at: string;
  updated_at: string;
}

export interface CreditCard {
  id: string;
  user_id: string;
  card_name: string;
  bank: string | null;
  last_four: string | null;
  statement_day: number;
  due_day: number;
  credit_limit: number | null;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Installment {
  id: string;
  user_id: string;
  credit_card_id: string;
  description: string;
  total_amount: number;
  monthly_amount: number;
  total_months: number;
  paid_months: number;
  start_date: string;  // ISO date "YYYY-MM-DD"
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── View / derived types ─────────────────────────────────────

export interface ActiveInstallmentView extends Installment {
  remaining_months: number;
  card_name: string;
  statement_day: number;
  due_day: number;
  card_color: string;
}

export interface UpcomingCardBill {
  card_id: string;
  user_id: string;
  card_name: string;
  statement_day: number;
  due_day: number;
  color: string;
  total_installment_due: number;
}

// ─── Forecast payload ─────────────────────────────────────────
export interface ForecastResult {
  currentLiquidCash: number;
  expectedIncome: number;
  fixedExpenses: number;
  totalCardDue: number;
  safeToSpend: number;
}

// ─── Form input types (partial, for create/update) ────────────
export type TransactionInput = Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type CreditCardInput  = Omit<CreditCard,  'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type InstallmentInput = Omit<Installment, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export interface RecurringExpense {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  category: TransactionCategory;
  due_day: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type RecurringExpenseInput = Omit<RecurringExpense, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

// ─── Category metadata ────────────────────────────────────────
export const INCOME_CATEGORIES: { value: TransactionCategory; label: string }[] = [
  { value: 'salary',       label: 'Salary' },
  { value: 'freelance',    label: 'Freelance' },
  { value: 'investment',   label: 'Investment' },
  { value: 'other_income', label: 'Other Income' },
];

export const EXPENSE_CATEGORIES: { value: TransactionCategory; label: string }[] = [
  { value: 'food',          label: 'Food & Drink' },
  { value: 'transport',     label: 'Transport' },
  { value: 'shopping',      label: 'Shopping' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'utilities',     label: 'Utilities' },
  { value: 'health',        label: 'Health' },
  { value: 'education',     label: 'Education' },
  { value: 'travel',        label: 'Travel' },
  { value: 'other_expense', label: 'Other' },
];
