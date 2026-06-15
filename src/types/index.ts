// ─── Domain Types ─────────────────────────────────────────────

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  currency: string;
  created_at: string;
  updated_at: string;
}

/** รายรับ */
export interface Income {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  month_key: string; // YYYY-MM
  created_at: string;
  updated_at: string;
}

/** รายจ่าย */
export interface Expense {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  month_key: string; // YYYY-MM
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
}

/** ผ่อนชำระ */
export interface Installment {
  id: string;
  user_id: string;
  description: string;
  total_price: number;
  total_months: number;
  monthly_amount: number;
  start_month: string; // YYYY-MM
  paid_months: number;
  created_at: string;
  updated_at: string;
}

/** ซื้อร่วม */
export interface SharedExpense {
  id: string;
  user_id: string;
  description: string;
  total_amount: number;
  split_count: number;
  my_share: number;
  month_key: string; // YYYY-MM
  include_in_expenses: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Input types (for create operations) ─────────────────────

export type IncomeInput        = Omit<Income,        'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type ExpenseInput       = Omit<Expense,       'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type InstallmentInput   = Omit<Installment,   'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type SharedExpenseInput = Omit<SharedExpense, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

// ─── Update types (partial, id required) ─────────────────────

export type IncomeUpdate        = Partial<IncomeInput>        & { id: string };
export type ExpenseUpdate       = Partial<ExpenseInput>       & { id: string };
export type InstallmentUpdate   = Partial<InstallmentInput>   & { id: string };
export type SharedExpenseUpdate = Partial<SharedExpenseInput> & { id: string };

// ─── Computed monthly summary ─────────────────────────────────

export interface MonthlySummary {
  month_key: string;      // YYYY-MM
  income: number;
  expenses: number;
  installments: number;   // sum of monthly_amount for active installments covering this month
  shared: number;         // sum of my_share where include_in_expenses = true
  total_out: number;      // expenses + installments + shared
  balance: number;        // income - total_out
}
