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
  sessionUser: any;
  isLocalMode: boolean;
  // Profile
  updateProfile: (patch: Partial<Pick<Profile, 'display_name' | 'currency'>>) => Promise<void>;
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
  const [sessionUser, setSessionUser] = useState<any | null>(null);

  const isLocalModeRef = useRef(false);
  const localUserIdRef = useRef<string | null>(null);

  const [isLocalMode, setIsLocalMode] = useState(false);

  // Get or create a local user ID stored in localStorage (fallback when anonymous auth unavailable)
  const getLocalUserId = useCallback((): string => {
    const LOCAL_UID_KEY = 'fintrack_local_uid';
    let uid = localStorage.getItem(LOCAL_UID_KEY);
    if (!uid) {
      // Generate a UUID v4
      uid = crypto.randomUUID?.() ?? 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
      localStorage.setItem(LOCAL_UID_KEY, uid!);
    }
    return uid!;
  }, []);

  // Sync auth state — auto sign-in anonymously (single-user mode, no login screen)
  useEffect(() => {
    const RT_KEY = 'fintrack_rt';
    let cancelled = false;

    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;
        if (session) {
          localStorage.setItem(RT_KEY, session.refresh_token);
          setSessionUser(session.user);
          return;
        }

        // Try restoring from backed-up refresh token
        const storedRefreshToken = localStorage.getItem(RT_KEY);
        if (storedRefreshToken) {
          const { data: refreshData } = await supabase.auth.refreshSession({ refresh_token: storedRefreshToken });
          if (!cancelled && refreshData.session) {
            localStorage.setItem(RT_KEY, refreshData.session.refresh_token);
            setSessionUser(refreshData.session.user);
            return;
          }
        }

        // Try anonymous sign-in
        const { data, error } = await supabase.auth.signInAnonymously();
        if (cancelled) return;
        if (error) {
          // Anonymous provider disabled — fall back to local mode
          console.warn('Anonymous auth unavailable, using local mode:', error.message);
          const localUid = getLocalUserId();
          localUserIdRef.current = localUid;
          isLocalModeRef.current = true;
          setIsLocalMode(true);
          // Create a fake user object
          setSessionUser({ id: localUid, is_anonymous: true });
          return;
        }
        if (data.session) {
          localStorage.setItem(RT_KEY, data.session.refresh_token);
        }
        setSessionUser(data.user ?? null);
      } catch (err) {
        if (cancelled) return;
        console.warn('Auth error, using local mode:', err);
        const localUid = getLocalUserId();
        localUserIdRef.current = localUid;
        isLocalModeRef.current = true;
        setIsLocalMode(true);
        setSessionUser({ id: localUid, is_anonymous: true });
      }
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        localStorage.setItem(RT_KEY, session.refresh_token);
        isLocalModeRef.current = false;
        setIsLocalMode(false);
      }
      setSessionUser(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [getLocalUserId]);

  const refetchProfile = useCallback(async () => {
    if (!sessionUser) return;
    if (isLocalModeRef.current) {
      const { data } = await supabase.rpc('get_or_create_profile', { p_id: sessionUser.id });
      if (data && data.length > 0) setProfile(data[0] as Profile);
      return;
    }
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', sessionUser.id)
      .maybeSingle();
    if (data) setProfile(data as Profile);
  }, [sessionUser]);

  const refetchIncomes = useCallback(async () => {
    if (!sessionUser) return;
    if (isLocalModeRef.current) {
      const { data } = await supabase.rpc('get_incomes', { p_user_id: sessionUser.id });
      if (data) setIncomes(data as Income[]);
      return;
    }
    const { data } = await supabase
      .from('income')
      .select('*')
      .eq('user_id', sessionUser.id)
      .order('month_key', { ascending: false });
    if (data) setIncomes(data as Income[]);
  }, [sessionUser]);

  const refetchExpenses = useCallback(async () => {
    if (!sessionUser) return;
    if (isLocalModeRef.current) {
      const { data } = await supabase.rpc('get_expenses', { p_user_id: sessionUser.id });
      if (data) setExpenses(data as Expense[]);
      return;
    }
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', sessionUser.id)
      .order('month_key', { ascending: false });
    if (data) setExpenses(data as Expense[]);
  }, [sessionUser]);

  const refetchInstallments = useCallback(async () => {
    if (!sessionUser) return;
    if (isLocalModeRef.current) {
      const { data } = await supabase.rpc('get_installments', { p_user_id: sessionUser.id });
      if (data) setInstallments(data as Installment[]);
      return;
    }
    const { data } = await supabase
      .from('installments_v2')
      .select('*')
      .eq('user_id', sessionUser.id)
      .order('start_month', { ascending: false });
    if (data) setInstallments(data as Installment[]);
  }, [sessionUser]);

  const refetchShared = useCallback(async () => {
    if (!sessionUser) return;
    if (isLocalModeRef.current) {
      const { data } = await supabase.rpc('get_shared_expenses', { p_user_id: sessionUser.id });
      if (data) setSharedExpenses(data as SharedExpense[]);
      return;
    }
    const { data } = await supabase
      .from('shared_expenses')
      .select('*')
      .eq('user_id', sessionUser.id)
      .order('month_key', { ascending: false });
    if (data) setSharedExpenses(data as SharedExpense[]);
  }, [sessionUser]);

  const refetchAll = useCallback(async () => {
    if (!sessionUser) return;
    setLoading(true);
    await Promise.all([
      refetchProfile(),
      refetchIncomes(),
      refetchExpenses(),
      refetchInstallments(),
      refetchShared(),
    ]);
    setLoading(false);
  }, [sessionUser, refetchProfile, refetchIncomes, refetchExpenses, refetchInstallments, refetchShared]);

  useEffect(() => {
    if (sessionUser) {
      void refetchAll();
    } else {
      setProfile(null);
      setIncomes([]);
      setExpenses([]);
      setInstallments([]);
      setSharedExpenses([]);
      setMonthlySummaries([]);
    }
  }, [sessionUser, refetchAll]);

  // Recompute summaries whenever source data changes
  useEffect(() => {
    setMonthlySummaries(computeSummaries(incomes, expenses, installments, sharedExpenses));
  }, [incomes, expenses, installments, sharedExpenses]);

  // ─── Mutations ────────────────────────────────────────────────

  const updateProfile = async (patch: Partial<Pick<Profile, 'display_name' | 'currency'>>) => {
    if (!sessionUser) throw new Error('Not authenticated');
    if (isLocalModeRef.current) {
      const { error } = await supabase.rpc('update_profile', {
        p_id: sessionUser.id,
        p_display_name: patch.display_name ?? null,
        p_currency: patch.currency ?? null,
      });
      if (error) throw new Error(error.message);
      setProfile(prev => prev ? { ...prev, ...patch } : prev);
      return;
    }
    const { data, error } = await supabase
      .from('profiles')
      .update(patch)
      .eq('id', sessionUser.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    setProfile(data as Profile);
  };

  const createIncome = async (input: IncomeInput) => {
    if (!sessionUser) throw new Error('Not authenticated');
    if (isLocalModeRef.current) {
      const { data, error } = await supabase.rpc('create_income', {
        p_user_id: sessionUser.id,
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
    }
    const { data, error } = await supabase
      .from('income')
      .insert({ ...input, user_id: sessionUser.id })
      .select()
      .single();
    if (error) throw new Error(error.message);
    setIncomes(prev => [data as Income, ...prev]);
    return data as Income;
  };

  const deleteIncome = async (id: string) => {
    if (isLocalModeRef.current) {
      const { error } = await supabase.rpc('delete_income', { p_id: id, p_user_id: sessionUser!.id });
      if (error) throw new Error(error.message);
      setIncomes(prev => prev.filter(i => i.id !== id));
      return;
    }
    const { error } = await supabase.from('income').delete().eq('id', id);
    if (error) throw new Error(error.message);
    setIncomes(prev => prev.filter(i => i.id !== id));
  };

  const createExpense = async (input: ExpenseInput) => {
    if (!sessionUser) throw new Error('Not authenticated');
    if (isLocalModeRef.current) {
      const { data, error } = await supabase.rpc('create_expense', {
        p_user_id: sessionUser.id,
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
    }
    const { data, error } = await supabase
      .from('expenses')
      .insert({ ...input, user_id: sessionUser.id })
      .select()
      .single();
    if (error) throw new Error(error.message);
    setExpenses(prev => [data as Expense, ...prev]);
    return data as Expense;
  };

  const deleteExpense = async (id: string) => {
    if (isLocalModeRef.current) {
      const { error } = await supabase.rpc('delete_expense', { p_id: id, p_user_id: sessionUser!.id });
      if (error) throw new Error(error.message);
      setExpenses(prev => prev.filter(e => e.id !== id));
      return;
    }
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) throw new Error(error.message);
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const toggleExpenseRecurring = async (id: string, is_recurring: boolean) => {
    if (isLocalModeRef.current) {
      const { error } = await supabase.rpc('toggle_expense_recurring', {
        p_id: id, p_user_id: sessionUser!.id, p_is_recurring: is_recurring,
      });
      if (error) throw new Error(error.message);
      setExpenses(prev => prev.map(e => e.id === id ? { ...e, is_recurring } : e));
      return;
    }
    const { error } = await supabase.from('expenses').update({ is_recurring }).eq('id', id);
    if (error) throw new Error(error.message);
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, is_recurring } : e));
  };

  const createInstallment = async (input: InstallmentInput) => {
    if (!sessionUser) throw new Error('Not authenticated');
    if (isLocalModeRef.current) {
      const { data, error } = await supabase.rpc('create_installment', {
        p_user_id: sessionUser.id,
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
    }
    const { data, error } = await supabase
      .from('installments_v2')
      .insert({ ...input, user_id: sessionUser.id })
      .select()
      .single();
    if (error) throw new Error(error.message);
    setInstallments(prev => [data as Installment, ...prev]);
    return data as Installment;
  };

  const deleteInstallment = async (id: string) => {
    if (isLocalModeRef.current) {
      const { error } = await supabase.rpc('delete_installment', { p_id: id, p_user_id: sessionUser!.id });
      if (error) throw new Error(error.message);
      setInstallments(prev => prev.filter(i => i.id !== id));
      return;
    }
    const { error } = await supabase.from('installments_v2').delete().eq('id', id);
    if (error) throw new Error(error.message);
    setInstallments(prev => prev.filter(i => i.id !== id));
  };

  const markInstallmentPaid = async (id: string) => {
    const current = installments.find(i => i.id === id);
    if (!current) return;
    const newPaid = current.paid_months + 1;
    if (isLocalModeRef.current) {
      const { error } = await supabase.rpc('mark_installment_paid', { p_id: id, p_user_id: sessionUser!.id });
      if (error) throw new Error(error.message);
      setInstallments(prev => prev.map(i => i.id === id ? { ...i, paid_months: newPaid } : i));
      return;
    }
    const { data, error } = await supabase
      .from('installments_v2')
      .update({ paid_months: newPaid })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    setInstallments(prev => prev.map(i => i.id === id ? (data as Installment) : i));
  };

  const createSharedExpense = async (input: SharedExpenseInput) => {
    if (!sessionUser) throw new Error('Not authenticated');
    if (isLocalModeRef.current) {
      const { data, error } = await supabase.rpc('create_shared_expense', {
        p_user_id: sessionUser.id,
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
    }
    const { data, error } = await supabase
      .from('shared_expenses')
      .insert({ ...input, user_id: sessionUser.id })
      .select()
      .single();
    if (error) throw new Error(error.message);
    setSharedExpenses(prev => [data as SharedExpense, ...prev]);
    return data as SharedExpense;
  };

  const deleteSharedExpense = async (id: string) => {
    if (isLocalModeRef.current) {
      const { error } = await supabase.rpc('delete_shared_expense', { p_id: id, p_user_id: sessionUser!.id });
      if (error) throw new Error(error.message);
      setSharedExpenses(prev => prev.filter(s => s.id !== id));
      return;
    }
    const { error } = await supabase.from('shared_expenses').delete().eq('id', id);
    if (error) throw new Error(error.message);
    setSharedExpenses(prev => prev.filter(s => s.id !== id));
  };

  const toggleSharedInclude = async (id: string, include: boolean) => {
    if (isLocalModeRef.current) {
      const { error } = await supabase.rpc('toggle_shared_include', {
        p_id: id, p_user_id: sessionUser!.id, p_include: include,
      });
      if (error) throw new Error(error.message);
      setSharedExpenses(prev =>
        prev.map(s => s.id === id ? { ...s, include_in_expenses: include } : s)
      );
      return;
    }
    const { error } = await supabase
      .from('shared_expenses')
      .update({ include_in_expenses: include })
      .eq('id', id);
    if (error) throw new Error(error.message);
    setSharedExpenses(prev =>
      prev.map(s => s.id === id ? { ...s, include_in_expenses: include } : s)
    );
  };

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
        refetchIncomes,
        refetchExpenses,
        refetchInstallments,
        refetchShared,
        sessionUser,
        isLocalMode,
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
      }}
    >
      {children}
    </DataContext.Provider>
  );
}
