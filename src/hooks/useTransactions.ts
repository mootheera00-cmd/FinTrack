import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { startOfMonthISO, endOfMonthISO } from '@/lib/utils';
import type { Transaction, TransactionInput } from '@/types';

interface UseTransactionsOptions {
  /** Defaults to current month */
  from?: string;
  to?: string;
}

export function useTransactions(options: UseTransactionsOptions = {}) {
  const from = options.from ?? startOfMonthISO();
  const to   = options.to   ?? endOfMonthISO();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('transactions')
      .select('*')
      .gte('txn_date', from)
      .lte('txn_date', to)
      .order('txn_date', { ascending: false });

    if (err) setError(err.message);
    else setTransactions((data as Transaction[]) ?? []);

    setLoading(false);
  }, [from, to]);

  useEffect(() => { void fetch(); }, [fetch]);

  const create = useCallback(async (input: TransactionInput) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error: err } = await supabase
      .from('transactions')
      .insert({ ...input, user_id: user.id })
      .select()
      .single();

    if (err) throw new Error(err.message);
    setTransactions((prev) => [data as Transaction, ...prev]);
    return data as Transaction;
  }, []);

  const update = useCallback(async (id: string, patch: Partial<TransactionInput>) => {
    const { data, error: err } = await supabase
      .from('transactions')
      .update(patch)
      .eq('id', id)
      .select()
      .single();

    if (err) throw new Error(err.message);
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? (data as Transaction) : t))
    );
    return data as Transaction;
  }, []);

  const remove = useCallback(async (id: string) => {
    const { error: err } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (err) throw new Error(err.message);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Derived: totals for the current period
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return { transactions, loading, error, totalIncome, totalExpenses, refetch: fetch, create, update, remove };
}
