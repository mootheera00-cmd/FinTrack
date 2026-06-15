import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { advanceMonthKey } from '@/lib/utils';
import { saveAllToCache, loadAllFromCache, clearCache } from '@/lib/db-cache';
import { downloadBackup, parseBackupFile, type BackupData } from '@/lib/backup';
import type {
  Profile,
  Income,
  IncomeInput,
  IncomeUpdate,
  Expense,
  ExpenseInput,
  ExpenseUpdate,
  Installment,
  InstallmentInput,
  InstallmentUpdate,
  SharedExpense,
  SharedExpenseInput,
  SharedExpenseUpdate,
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
  /** True on first mount while cache is loaded */
  initialLoading: boolean;
  /** ISO timestamp of last successful Supabase sync */
  lastSyncTime: string | null;
  refetchAll: () => Promise<void>;
  // Income CRUD
  createIncome: (input: IncomeInput) => Promise<Income>;
  updateIncome: (input: IncomeUpdate) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
  // Expense CRUD
  createExpense: (input: ExpenseInput) => Promise<Expense>;
  updateExpense: (input: ExpenseUpdate) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  toggleExpenseRecurring: (id: string, is_recurring: boolean) => Promise<void>;
  // Installment CRUD
  createInstallment: (input: InstallmentInput) => Promise<Installment>;
  updateInstallment: (input: InstallmentUpdate) => Promise<void>;
  deleteInstallment: (id: string) => Promise<void>;
  markInstallmentPaid: (id: string) => Promise<void>;
  // Shared expense CRUD
  createSharedExpense: (input: SharedExpenseInput) => Promise<SharedExpense>;
  updateSharedExpense: (input: SharedExpenseUpdate) => Promise<void>;
  deleteSharedExpense: (id: string) => Promise<void>;
  toggleSharedInclude: (id: string, include: boolean) => Promise<void>;
  // CSV Export
  exportCSV: () => void;
  // Backup & Restore
  backup: () => void;
  restore: (file: File) => Promise<void>;
  // Cache control
  clearLocalCache: () => void;
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
  const [initialLoading, setInitialLoading] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const mountedRef = useRef(false);

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

  // ─── Cache-first mount ──────────────────────────────────────
  // Load from localStorage cache instantly, then sync from Supabase
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    // 1. Load cached data instantly (synchronous, 0ms)
    const cached = loadAllFromCache();
    if (cached) {
      setProfile(cached.data.profile);
      setIncomes(cached.data.incomes);
      setExpenses(cached.data.expenses);
      setInstallments(cached.data.installments);
      setSharedExpenses(cached.data.sharedExpenses);
    }
    setInitialLoading(false);

    // 2. Ensure profile exists via RPC
    supabase.rpc('get_or_create_profile', { p_id: localUserId }).then(({ data }) => {
      if (data && data.length > 0) setProfile(data[0] as Profile);
    });

    // 3. Background sync from Supabase
    syncFromSupabase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Full sync from Supabase — sets loading while fetching */
  const syncFromSupabase = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, iRes, eRes, instRes, sRes] = await Promise.all([
        supabase.rpc('get_or_create_profile', { p_id: localUserId }),
        supabase.rpc('get_incomes',             { p_user_id: localUserId }),
        supabase.rpc('get_expenses',            { p_user_id: localUserId }),
        supabase.rpc('get_installments',        { p_user_id: localUserId }),
        supabase.rpc('get_shared_expenses',     { p_user_id: localUserId }),
      ]);

      if (pRes.data  && pRes.data.length  > 0) setProfile(pRes.data[0] as Profile);
      if (iRes.data)  setIncomes(iRes.data as Income[]);
      if (eRes.data)  setExpenses(eRes.data as Expense[]);
      if (instRes.data) setInstallments(instRes.data as Installment[]);
      if (sRes.data)  setSharedExpenses(sRes.data as SharedExpense[]);

      // Save fresh data to cache for next launch
      saveAllToCache({
        profile:        pRes.data?.[0] as Profile ?? null,
        incomes:        iRes.data  as Income[]        ?? [],
        expenses:       eRes.data  as Expense[]       ?? [],
        installments:   instRes.data as Installment[] ?? [],
        sharedExpenses: sRes.data  as SharedExpense[] ?? [],
      });
      setLastSyncTime(new Date().toISOString());
    } catch (err) {
      console.warn('Background sync failed — cached data shown', err);
    } finally {
      setLoading(false);
    }
  }, [localUserId]);

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
    await syncFromSupabase();
  }, [syncFromSupabase]);

  // Recompute summaries whenever source data changes
  useEffect(() => {
    setMonthlySummaries(computeSummaries(incomes, expenses, installments, sharedExpenses));
  }, [incomes, expenses, installments, sharedExpenses]);

  // ─── Mutations ────────────────────────────────────────────────

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

  const updateIncome = async (input: IncomeUpdate) => {
    const { data, error } = await supabase.rpc('update_income', {
      p_id: input.id,
      p_user_id: localUserId,
      p_name: input.name ?? null,
      p_amount: input.amount ?? null,
      p_month_key: input.month_key ?? null,
    });
    if (error) throw new Error(error.message);
    if (data && data.length > 0) {
      setIncomes(prev => prev.map(i => i.id === input.id ? (data[0] as Income) : i));
    }
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

  const updateExpense = async (input: ExpenseUpdate) => {
    const { data, error } = await supabase.rpc('update_expense', {
      p_id: input.id,
      p_user_id: localUserId,
      p_name: input.name ?? null,
      p_amount: input.amount ?? null,
      p_month_key: input.month_key ?? null,
      p_is_recurring: input.is_recurring ?? null,
    });
    if (error) throw new Error(error.message);
    if (data && data.length > 0) {
      setExpenses(prev => prev.map(e => e.id === input.id ? (data[0] as Expense) : e));
    }
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

  const updateInstallment = async (input: InstallmentUpdate) => {
    const { data, error } = await supabase.rpc('update_installment', {
      p_id: input.id,
      p_user_id: localUserId,
      p_description: input.description ?? null,
      p_total_price: input.total_price ?? null,
      p_total_months: input.total_months ?? null,
      p_monthly_amount: input.monthly_amount ?? null,
      p_start_month: input.start_month ?? null,
    });
    if (error) throw new Error(error.message);
    if (data && data.length > 0) {
      setInstallments(prev => prev.map(i => i.id === input.id ? (data[0] as Installment) : i));
    }
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

  const updateSharedExpense = async (input: SharedExpenseUpdate) => {
    const { data, error } = await supabase.rpc('update_shared_expense', {
      p_id: input.id,
      p_user_id: localUserId,
      p_description: input.description ?? null,
      p_total_amount: input.total_amount ?? null,
      p_split_count: input.split_count ?? null,
      p_my_share: input.my_share ?? null,
      p_month_key: input.month_key ?? null,
      p_include_in_expenses: input.include_in_expenses ?? null,
    });
    if (error) throw new Error(error.message);
    if (data && data.length > 0) {
      setSharedExpenses(prev => prev.map(s => s.id === input.id ? (data[0] as SharedExpense) : s));
    }
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

  // ─── Backup & Restore ────────────────────────────────────
  const backup = useCallback(() => {
    downloadBackup({ incomes, expenses, installments, sharedExpenses });
    // Also save to cache immediately
    saveAllToCache({ profile, incomes, expenses, installments, sharedExpenses });
  }, [incomes, expenses, installments, sharedExpenses, profile]);

  const restore = useCallback(async (file: File) => {
    const data: BackupData = await parseBackupFile(file);
    // Import data via RPC — one by one
    for (const inc of data.incomes) {
      await supabase.rpc('create_income', {
        p_user_id: localUserId, p_name: inc.name,
        p_amount: inc.amount, p_month_key: inc.month_key,
      });
    }
    for (const exp of data.expenses) {
      await supabase.rpc('create_expense', {
        p_user_id: localUserId, p_name: exp.name,
        p_amount: exp.amount, p_month_key: exp.month_key,
        p_is_recurring: exp.is_recurring,
      });
    }
    for (const inst of data.installments) {
      await supabase.rpc('create_installment', {
        p_user_id: localUserId, p_description: inst.description,
        p_total_price: inst.total_price, p_total_months: inst.total_months,
        p_monthly_amount: inst.monthly_amount, p_start_month: inst.start_month,
      });
    }
    for (const se of data.sharedExpenses) {
      await supabase.rpc('create_shared_expense', {
        p_user_id: localUserId, p_description: se.description,
        p_total_amount: se.total_amount, p_split_count: se.split_count,
        p_my_share: se.my_share, p_month_key: se.month_key,
      });
    }
    // Refresh all data from server
    await syncFromSupabase();
  }, [localUserId, syncFromSupabase]);

  const clearLocalCache = useCallback(() => {
    clearCache();
  }, []);

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
        initialLoading,
        lastSyncTime,
        refetchAll,
        createIncome,
        updateIncome,
        deleteIncome,
        createExpense,
        updateExpense,
        deleteExpense,
        toggleExpenseRecurring,
        createInstallment,
        updateInstallment,
        deleteInstallment,
        markInstallmentPaid,
        createSharedExpense,
        updateSharedExpense,
        deleteSharedExpense,
        toggleSharedInclude,
        exportCSV,
        backup,
        restore,
        clearLocalCache,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}
