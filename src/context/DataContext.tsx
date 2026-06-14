import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { advanceMonthKey } from '@/lib/utils';
import type {
  Profile,
  Income,
  IncomeInput,
  Expense,
  ExpenseInput,
  Installment,
  InstallmentInput,
  SharedExpense,
  SharedExpenseInput,
  MonthlySummary,
} from '@/types';

interface DataContextType {
  profile: Profile | null;
  incomes: Income[];
  expenses: Expense[];
  installments: Installment[];
  sharedExpenses: SharedExpense[];
  monthlySummaries: MonthlySummary[];
  loading: boolean;
  refetchAll: () => Promise<void>;
  refetchIncomes: () => Promise<void>;
  refetchExpenses: () => Promise<void>;
  refetchInstallments: () => Promise<void>;
  refetchShared: () => Promise<void>;
  // Income CRUD
  createIncome: (input: IncomeInput) => Promise<Income>;
  deleteIncome: (id: string) => Promise<void>;
  // Expense CRUD
  createExpense: (input: ExpenseInput) => Promise<Expense>;
  deleteExpense: (id: string) => Promise<void>;
  toggleExpenseRecurring: (id: string, is_recurring: boolean) => Promise<void>;
  // Installment CRUD
  createInstallment: (input: InstallmentInput) => Promise<Installment>;
  deleteInstallment: (id: string) => Promise<void>;
  markInstallmentPaid: (id: string) => Promise<void>;
  // Shared expense CRUD
  createSharedExpense: (input: SharedExpenseInput) => Promise<SharedExpense>;
  deleteSharedExpense: (id: string) => Promise<void>;
  toggleSharedInclude: (id: string, include: boolean) => Promise<void>;
  // CSV Export
  exportCSV: () => void;
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

/** Compute monthly summary from raw data */
function computeSummaries(
  incomes: Income[],
  expenses: Expense[],
  installments: Installment[],
  sharedExpenses: SharedExpense[],
): MonthlySummary[] {
  const keys = new Set<string>();
  incomes.forEach(i => keys.add(i.month_key));
  expenses.forEach(e => keys.add(e.month_key));
  sharedExpenses.forEach(s => keys.add(s.month_key));
  installments.forEach(inst => {
    for (let idx = 0; idx < inst.total_months; idx++) {
      const mk = advanceMonthKey(inst.start_month, idx);
      keys.add(mk);
    }
  });

  return Array.from(keys).sort().map(month_key => {
    const income = incomes
      .filter(i => i.month_key === month_key)
      .reduce((s, i) => s + i.amount, 0);

    const expTotal = expenses
      .filter(e => e.month_key === month_key)
      .reduce((s, e) => s + e.amount, 0);

    const instTotal = installments
      .filter(inst => {
        const endMonth = advanceMonthKey(inst.start_month, inst.total_months - 1);
        return inst.start_month <= month_key && month_key <= endMonth;
      })
      .reduce((s, inst) => s + inst.monthly_amount, 0);

    const shared = sharedExpenses
      .filter(se => se.month_key === month_key && se.include_in_expenses)
      .reduce((s, se) => s + se.my_share, 0);

    const total_out = expTotal + instTotal + shared;
    return {
      month_key,
      income,
      expenses: expTotal,
      installments: instTotal,
      shared,
      total_out,
      balance: income - total_out,
    };
  });
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [sharedExpenses, setSharedExpenses] = useState<SharedExpense[]>([]);
  const [monthlySummaries, setMonthlySummaries] = useState<MonthlySummary[]>([]);
  const [loading, setLoading] = useState(false);

  // Single static local user ID — no login needed
  const LOCAL_UID_KEY = 'fintrack_local_uid';
  const getLocalUserId = useCallback((): string => {
    let uid = localStorage.getItem(LOCAL_UID_KEY);
    if (!uid) {
      uid = crypto.randomUUID?.() ?? 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
      localStorage.setItem(LOCAL_UID_KEY, uid!);
    }
    return uid!;
  }, []);
  const localUserId = getLocalUserId();
  const isLocalModeRef = useRef(true);

  // Fetch all data on mount
  useEffect(() => {
    // Ensure profile exists via RPC
    supabase.rpc('get_or_create_profile', { p_id: localUserId }).then(({ data }) => {
      if (data && data.length > 0) setProfile(data[0] as Profile);
    });
    void refetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refetchProfile = useCallback(async () => {
    const { data } = await supabase.rpc('get_or_create_profile', { p_id: localUserId });
    if (data && data.length > 0) setProfile(data[0] as Profile);
  }, [localUserId]);

  const refetchIncomes = useCallback(async () => {
    const { data } = await supabase.rpc('get_incomes', { p_user_id: localUserId });
    if (data) setIncomes(data as Income[]);
  }, [localUserId]);

  const refetchExpenses = useCallback(async () => {
    const { data } = await supabase.rpc('get_expenses', { p_user_id: localUserId });
    if (data) setExpenses(data as Expense[]);
  }, [localUserId]);

  const refetchInstallments = useCallback(async () => {
    const { data } = await supabase.rpc('get_installments', { p_user_id: localUserId });
    if (data) setInstallments(data as Installment[]);
  }, [localUserId]);

  const refetchShared = useCallback(async () => {
    const { data } = await supabase.rpc('get_shared_expenses', { p_user_id: localUserId });
    if (data) setSharedExpenses(data as SharedExpense[]);
  }, [localUserId]);

  const refetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      refetchProfile(),
      refetchIncomes(),
      refetchExpenses(),
      refetchInstallments(),
      refetchShared(),
    ]);
    setLoading(false);
  }, [refetchProfile, refetchIncomes, refetchExpenses, refetchInstallments, refetchShared]);

  // Fetch on mount
  useEffect(() => {
    void refetchAll();
  }, [refetchAll]);

  // Recompute summaries whenever source data changes
  useEffect(() => {
    setMonthlySummaries(computeSummaries(incomes, expenses, installments, sharedExpenses));
  }, [incomes, expenses, installments, sharedExpenses]);

  // ─── Mutations ────────────────────────────────────────────────

  const updateProfile = async (patch: Partial<Pick<Profile, 'display_name' | 'currency'>>) => {
    const { error } = await supabase.rpc('update_profile', {
      p_id: localUserId,
      p_display_name: patch.display_name ?? null,
      p_currency: patch.currency ?? null,
    });
    if (error) throw new Error(error.message);
    setProfile(prev => prev ? { ...prev, ...patch } : prev);
  };

  const createIncome = async (input: IncomeInput) => {
    const { data, error } = await supabase.rpc('create_income', {
      p_user_id: localUserId,
      p_name: input.name,
      p_amount: input.amount,
      p_month_key: input.month_key,
    });
    if (error) throw new Error(error.message);
    if (data && data.length > 0) {
      setIncomes(prev => [data[0] as Income, ...prev]);
      return data[0] as Income;
    }
    throw new Error('Failed to create income');
  };

  const deleteIncome = async (id: string) => {
    const { error } = await supabase.rpc('delete_income', { p_id: id, p_user_id: localUserId });
    if (error) throw new Error(error.message);
    setIncomes(prev => prev.filter(i => i.id !== id));
  };

  const createExpense = async (input: ExpenseInput) => {
    const { data, error } = await supabase.rpc('create_expense', {
      p_user_id: localUserId,
      p_name: input.name,
      p_amount: input.amount,
      p_month_key: input.month_key,
      p_is_recurring: input.is_recurring,
    });
    if (error) throw new Error(error.message);
    if (data && data.length > 0) {
      setExpenses(prev => [data[0] as Expense, ...prev]);
      return data[0] as Expense;
    }
    throw new Error('Failed to create expense');
  };

  const deleteExpense = async (id: string) => {
    const { error } = await supabase.rpc('delete_expense', { p_id: id, p_user_id: localUserId });
    if (error) throw new Error(error.message);
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const toggleExpenseRecurring = async (id: string, is_recurring: boolean) => {
    const { error } = await supabase.rpc('toggle_expense_recurring', {
      p_id: id, p_user_id: localUserId, p_is_recurring: is_recurring,
    });
    if (error) throw new Error(error.message);
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, is_recurring } : e));
  };

  const createInstallment = async (input: InstallmentInput) => {
    const { data, error } = await supabase.rpc('create_installment', {
      p_user_id: localUserId,
      p_description: input.description,
      p_total_price: input.total_price,
      p_total_months: input.total_months,
      p_monthly_amount: input.monthly_amount,
      p_start_month: input.start_month,
    });
    if (error) throw new Error(error.message);
    if (data && data.length > 0) {
      setInstallments(prev => [data[0] as Installment, ...prev]);
      return data[0] as Installment;
    }
    throw new Error('Failed to create installment');
  };

  const deleteInstallment = async (id: string) => {
    const { error } = await supabase.rpc('delete_installment', { p_id: id, p_user_id: localUserId });
    if (error) throw new Error(error.message);
    setInstallments(prev => prev.filter(i => i.id !== id));
  };

  const markInstallmentPaid = async (id: string) => {
    const current = installments.find(i => i.id === id);
    if (!current) return;
    const newPaid = current.paid_months + 1;
    const { error } = await supabase.rpc('mark_installment_paid', { p_id: id, p_user_id: localUserId });
    if (error) throw new Error(error.message);
    setInstallments(prev => prev.map(i => i.id === id ? { ...i, paid_months: newPaid } : i));
  };

  const createSharedExpense = async (input: SharedExpenseInput) => {
    const { data, error } = await supabase.rpc('create_shared_expense', {
      p_user_id: localUserId,
      p_description: input.description,
      p_total_amount: input.total_amount,
      p_split_count: input.split_count,
      p_my_share: input.my_share,
      p_month_key: input.month_key,
    });
    if (error) throw new Error(error.message);
    if (data && data.length > 0) {
      setSharedExpenses(prev => [data[0] as SharedExpense, ...prev]);
      return data[0] as SharedExpense;
    }
    throw new Error('Failed to create shared expense');
  };

  const deleteSharedExpense = async (id: string) => {
    const { error } = await supabase.rpc('delete_shared_expense', { p_id: id, p_user_id: localUserId });
    if (error) throw new Error(error.message);
    setSharedExpenses(prev => prev.filter(s => s.id !== id));
  };

  const toggleSharedInclude = async (id: string, include: boolean) => {
    const { error } = await supabase.rpc('toggle_shared_include', {
      p_id: id, p_user_id: localUserId, p_include: include,
    });
    if (error) throw new Error(error.message);
    setSharedExpenses(prev =>
      prev.map(s => s.id === id ? { ...s, include_in_expenses: include } : s)
    );
  };

  // ─── CSV Export ──────────────────────────────────────────
  const exportCSV = useCallback(() => {
    const escCsv = (val: unknown): string => {
      const s = String(val ?? '');
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? '"' + s.replace(/"/g, '""') + '"'
        : s;
    };

    const rows: string[] = [];

    // Incomes
    rows.push('=== รายรับ (Income) ===');
    rows.push('ชื่อ,จำนวนเงิน,เดือน');
    incomes.forEach(i => rows.push([escCsv(i.name), i.amount, i.month_key].join(',')));

    rows.push('');
    rows.push('=== รายจ่าย (Expenses) ===');
    rows.push('ชื่อ,จำนวนเงิน,เดือน,รายการประจำ');
    expenses.forEach(e => rows.push([escCsv(e.name), e.amount, e.month_key, e.is_recurring ? 'ใช่' : 'ไม่'].join(',')));

    rows.push('');
    rows.push('=== ผ่อนชำระ (Installments) ===');
    rows.push('รายละเอียด,ราคารวม,จำนวนงวด,งวดละ,เดือนเริ่ม,จ่ายแล้ว');
    installments.forEach(i => rows.push([escCsv(i.description), i.total_price, i.total_months, i.monthly_amount, i.start_month, i.paid_months].join(',')));

    rows.push('');
    rows.push('=== ซื้อร่วม (Shared Expenses) ===');
    rows.push('รายละเอียด,ยอดรวม,จำนวนคน,ส่วนแบ่งเรา,เดือน,นับรวมรายจ่าย');
    sharedExpenses.forEach(s => rows.push([escCsv(s.description), s.total_amount, s.split_count, s.my_share, s.month_key, s.include_in_expenses ? 'ใช่' : 'ไม่'].join(',')));

    const csv = rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fintrack-backup-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [incomes, expenses, installments, sharedExpenses]);

  return (
    <DataContext.Provider
      value={{
        profile,
        incomes,
        expenses,
        installments,
        sharedExpenses,
        monthlySummaries,
        loading,
        refetchAll,
        refetchShared,
        updateProfile,
        createIncome,
        deleteIncome,
        createExpense,
        deleteExpense,
        toggleExpenseRecurring,
        createInstallment,
        deleteInstallment,
        markInstallmentPaid,
        createSharedExpense,
        deleteSharedExpense,
        toggleSharedInclude,
        exportCSV,
        createIncome,
        deleteIncome,
        createExpense,
        deleteExpense,
        toggleExpenseRecurring,
        createInstallment,
        deleteInstallment,
        markInstallmentPaid,
        createSharedExpense,
        deleteSharedExpense,
        toggleSharedInclude,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}
