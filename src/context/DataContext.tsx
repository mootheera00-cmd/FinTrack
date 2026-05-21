import React, { createContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { startOfMonthISO, endOfMonthISO } from '@/lib/utils';
import type {
  Profile,
  Transaction,
  TransactionInput,
  CreditCard,
  CreditCardInput,
  Installment,
  InstallmentInput,
  RecurringExpense,
  RecurringExpenseInput,
} from '@/types';

export interface MonthlySummaryItem {
  month: string; // YYYY-MM-DD
  income: number;
  expense: number;
  remaining: number;
}

interface DataContextType {
  profile: Profile | null;
  transactions: Transaction[];
  monthlySummary: MonthlySummaryItem[];
  creditCards: CreditCard[];
  installments: Installment[];
  recurringExpenses: RecurringExpense[];
  loading: {
    profile: boolean;
    transactions: boolean;
    summary: boolean;
    cards: boolean;
    installments: boolean;
    recurring: boolean;
  };
  error: {
    profile: string | null;
    transactions: string | null;
    summary: string | null;
    cards: string | null;
    installments: string | null;
    recurring: string | null;
  };
  needDbMigration: boolean;
  refetchProfile: () => Promise<void>;
  refetchTransactions: () => Promise<void>;
  refetchSummary: () => Promise<void>;
  refetchCards: () => Promise<void>;
  refetchInstallments: () => Promise<void>;
  refetchRecurring: () => Promise<void>;
  refetchAll: () => Promise<void>;
  
  // Mutators
  updateProfile: (patch: Partial<Pick<Profile, 'display_name' | 'monthly_income' | 'liquid_cash' | 'currency'>>) => Promise<Profile>;
  createTransaction: (input: TransactionInput) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  createCreditCard: (input: CreditCardInput) => Promise<CreditCard>;
  createInstallment: (input: InstallmentInput) => Promise<Installment>;
  markInstallmentPaid: (id: string) => Promise<void>;
  deleteInstallment: (id: string) => Promise<void>;
  createRecurringExpense: (input: RecurringExpenseInput) => Promise<RecurringExpense>;
  deleteRecurringExpense: (id: string) => Promise<void>;
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummaryItem[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);

  const [loading, setLoading] = useState({
    profile: false,
    transactions: false,
    summary: false,
    cards: false,
    installments: false,
    recurring: false,
  });

  const [error, setError] = useState<{
    profile: string | null;
    transactions: string | null;
    summary: string | null;
    cards: string | null;
    installments: string | null;
    recurring: string | null;
  }>({
    profile: null,
    transactions: null,
    summary: null,
    cards: null,
    installments: null,
    recurring: null,
  });

  const [needDbMigration, setNeedDbMigration] = useState(false);
  const [sessionUser, setSessionUser] = useState<any>(null);

  // Sync auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const refetchProfile = useCallback(async () => {
    if (!sessionUser) return;
    setLoading((l) => ({ ...l, profile: true }));
    const { data, error: err } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', sessionUser.id)
      .single();

    if (err) {
      setError((e) => ({ ...e, profile: err.message }));
    } else {
      setProfile(data as Profile);
      setError((e) => ({ ...e, profile: null }));
    }
    setLoading((l) => ({ ...l, profile: false }));
  }, [sessionUser]);

  const refetchTransactions = useCallback(async () => {
    if (!sessionUser) return;
    setLoading((l) => ({ ...l, transactions: true }));
    const from = startOfMonthISO();
    const to = endOfMonthISO();

    const { data, error: err } = await supabase
      .from('transactions')
      .select('*')
      .gte('txn_date', from)
      .lte('txn_date', to)
      .order('txn_date', { ascending: false });

    if (err) {
      setError((e) => ({ ...e, transactions: err.message }));
    } else {
      setTransactions((data as Transaction[]) ?? []);
      setError((e) => ({ ...e, transactions: null }));
    }
    setLoading((l) => ({ ...l, transactions: false }));
  }, [sessionUser]);

  const refetchSummary = useCallback(async () => {
    if (!sessionUser) return;
    setLoading((l) => ({ ...l, summary: true }));
    const { data, error: err } = await supabase
      .from('monthly_summary')
      .select('*')
      .order('month', { ascending: true });

    if (err) {
      setError((e) => ({ ...e, summary: err.message }));
    } else {
      const monthsMap: Record<string, MonthlySummaryItem> = {};
      for (const row of data || []) {
        const monthKey = row.month;
        if (!monthsMap[monthKey]) {
          monthsMap[monthKey] = {
            month: monthKey,
            income: 0,
            expense: 0,
            remaining: 0,
          };
        }
        const amt = parseFloat(row.total || 0);
        if (row.type === 'income') {
          monthsMap[monthKey].income += amt;
        } else if (row.type === 'expense') {
          monthsMap[monthKey].expense += amt;
        }
        monthsMap[monthKey].remaining = monthsMap[monthKey].income - monthsMap[monthKey].expense;
      }
      setMonthlySummary(Object.values(monthsMap).sort((a, b) => a.month.localeCompare(b.month)));
      setError((e) => ({ ...e, summary: null }));
    }
    setLoading((l) => ({ ...l, summary: false }));
  }, [sessionUser]);

  const refetchCards = useCallback(async () => {
    if (!sessionUser) return;
    setLoading((l) => ({ ...l, cards: true }));
    const { data, error: err } = await supabase
      .from('credit_cards')
      .select('*')
      .order('created_at', { ascending: false });

    if (err) {
      setError((e) => ({ ...e, cards: err.message }));
    } else {
      setCreditCards((data as CreditCard[]) ?? []);
      setError((e) => ({ ...e, cards: null }));
    }
    setLoading((l) => ({ ...l, cards: false }));
  }, [sessionUser]);

  const refetchInstallments = useCallback(async () => {
    if (!sessionUser) return;
    setLoading((l) => ({ ...l, installments: true }));
    const { data, error: err } = await supabase
      .from('installments')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (err) {
      setError((e) => ({ ...e, installments: err.message }));
    } else {
      setInstallments((data as Installment[]) ?? []);
      setError((e) => ({ ...e, installments: null }));
    }
    setLoading((l) => ({ ...l, installments: false }));
  }, [sessionUser]);

  const refetchRecurring = useCallback(async () => {
    if (!sessionUser) return;
    setLoading((l) => ({ ...l, recurring: true }));
    const { data, error: err } = await supabase
      .from('recurring_expenses')
      .select('*')
      .eq('is_active', true)
      .order('due_day', { ascending: true });

    if (err) {
      // 42P01 is PostgreSQL code for "relation does not exist" (table doesn't exist yet)
      if (err.code === '42P01' || err.message?.includes('does not exist')) {
        setNeedDbMigration(true);
        console.warn('recurring_expenses table not found. DB migration required.');
      }
      setError((e) => ({ ...e, recurring: err.message }));
      setRecurringExpenses([]);
    } else {
      setRecurringExpenses((data as RecurringExpense[]) ?? []);
      setNeedDbMigration(false);
      setError((e) => ({ ...e, recurring: null }));
    }
    setLoading((l) => ({ ...l, recurring: false }));
  }, [sessionUser]);

  const refetchAll = useCallback(async () => {
    if (!sessionUser) return;
    await Promise.all([
      refetchProfile(),
      refetchTransactions(),
      refetchSummary(),
      refetchCards(),
      refetchInstallments(),
      refetchRecurring(),
    ]);
  }, [
    sessionUser,
    refetchProfile,
    refetchTransactions,
    refetchSummary,
    refetchCards,
    refetchInstallments,
    refetchRecurring,
  ]);

  // Initial load
  useEffect(() => {
    if (sessionUser) {
      void refetchAll();
    } else {
      // Reset states on logout
      setProfile(null);
      setTransactions([]);
      setMonthlySummary([]);
      setCreditCards([]);
      setInstallments([]);
      setRecurringExpenses([]);
    }
  }, [sessionUser, refetchAll]);

  // ─── Mutation Wrappers ───────────────────────────────────────

  const updateProfile = async (patch: Partial<Pick<Profile, 'display_name' | 'monthly_income' | 'liquid_cash' | 'currency'>>) => {
    if (!sessionUser) throw new Error('Not authenticated');
    const { data, error: err } = await supabase
      .from('profiles')
      .update(patch)
      .eq('id', sessionUser.id)
      .select()
      .single();

    if (err) throw new Error(err.message);
    setProfile(data as Profile);
    return data as Profile;
  };

  const createTransaction = async (input: TransactionInput) => {
    if (!sessionUser) throw new Error('Not authenticated');
    const { data, error: err } = await supabase
      .from('transactions')
      .insert({ ...input, user_id: sessionUser.id })
      .select()
      .single();

    if (err) throw new Error(err.message);
    
    // Update local cache
    setTransactions((prev) => [data as Transaction, ...prev]);
    // Trigger summaries updates in background
    void refetchSummary();
    
    // If it is an expense, adjust liquid cash if needed
    if (data.type === 'expense') {
      const updatedCash = (profile?.liquid_cash ?? 0) - data.amount;
      void updateProfile({ liquid_cash: updatedCash });
    } else if (data.type === 'income') {
      const updatedCash = (profile?.liquid_cash ?? 0) + data.amount;
      void updateProfile({ liquid_cash: updatedCash });
    }

    return data as Transaction;
  };

  const deleteTransaction = async (id: string) => {
    const target = transactions.find((t) => t.id === id);
    const { error: err } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (err) throw new Error(err.message);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    void refetchSummary();

    // Adjust liquid cash back
    if (target) {
      const diff = target.type === 'expense' ? target.amount : -target.amount;
      const updatedCash = (profile?.liquid_cash ?? 0) + diff;
      void updateProfile({ liquid_cash: updatedCash });
    }
  };

  const createCreditCard = async (input: CreditCardInput) => {
    if (!sessionUser) throw new Error('Not authenticated');
    const { data, error: err } = await supabase
      .from('credit_cards')
      .insert({ ...input, user_id: sessionUser.id })
      .select()
      .single();

    if (err) throw new Error(err.message);
    setCreditCards((prev) => [data as CreditCard, ...prev]);
    return data as CreditCard;
  };

  const createInstallment = async (input: InstallmentInput) => {
    if (!sessionUser) throw new Error('Not authenticated');
    const { data, error: err } = await supabase
      .from('installments')
      .insert({ ...input, user_id: sessionUser.id })
      .select()
      .single();

    if (err) throw new Error(err.message);
    setInstallments((prev) => [data as Installment, ...prev]);
    return data as Installment;
  };

  const markInstallmentPaid = async (id: string) => {
    const current = installments.find((i) => i.id === id);
    if (!current) return;

    const newPaid = current.paid_months + 1;
    const isDone = newPaid >= current.total_months;

    const { data, error: err } = await supabase
      .from('installments')
      .update({ paid_months: newPaid, is_active: !isDone })
      .eq('id', id)
      .select()
      .single();

    if (err) throw new Error(err.message);

    // Create a transaction auto-representing this expense
    const card = creditCards.find(c => c.id === current.credit_card_id);
    const cardLabel = card ? ` (${card.card_name})` : '';
    await createTransaction({
      type: 'expense',
      category: 'other_expense',
      amount: current.monthly_amount,
      note: `ค่างวด: ${current.description}${cardLabel} (${newPaid}/${current.total_months})`,
      txn_date: startOfMonthISO(), // Put in this month
    });

    setInstallments((prev) =>
      isDone
        ? prev.filter((i) => i.id !== id)
        : prev.map((i) => (i.id === id ? (data as Installment) : i))
    );
  };

  const deleteInstallment = async (id: string) => {
    const { error: err } = await supabase
      .from('installments')
      .update({ is_active: false })
      .eq('id', id);

    if (err) throw new Error(err.message);
    setInstallments((prev) => prev.filter((i) => i.id !== id));
  };

  const createRecurringExpense = async (input: RecurringExpenseInput) => {
    if (!sessionUser) throw new Error('Not authenticated');
    const { data, error: err } = await supabase
      .from('recurring_expenses')
      .insert({ ...input, user_id: sessionUser.id })
      .select()
      .single();

    if (err) throw new Error(err.message);
    setRecurringExpenses((prev) => [...prev, data as RecurringExpense].sort((a, b) => a.due_day - b.due_day));
    return data as RecurringExpense;
  };

  const deleteRecurringExpense = async (id: string) => {
    const { error: err } = await supabase
      .from('recurring_expenses')
      .delete()
      .eq('id', id);

    if (err) throw new Error(err.message);
    setRecurringExpenses((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <DataContext.Provider
      value={{
        profile,
        transactions,
        monthlySummary,
        creditCards,
        installments,
        recurringExpenses,
        loading,
        error,
        needDbMigration,
        refetchProfile,
        refetchTransactions,
        refetchSummary,
        refetchCards,
        refetchInstallments,
        refetchRecurring,
        refetchAll,
        updateProfile,
        createTransaction,
        deleteTransaction,
        createCreditCard,
        createInstallment,
        markInstallmentPaid,
        deleteInstallment,
        createRecurringExpense,
        deleteRecurringExpense,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}
