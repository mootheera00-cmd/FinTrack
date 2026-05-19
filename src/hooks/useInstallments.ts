import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Installment, InstallmentInput } from '@/types';

export function useInstallments(cardId?: string) {
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from('installments')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (cardId) query = query.eq('credit_card_id', cardId);

    const { data, error: err } = await query;
    if (err) setError(err.message);
    else setInstallments((data as Installment[]) ?? []);
    setLoading(false);
  }, [cardId]);

  useEffect(() => { void fetch(); }, [fetch]);

  const create = useCallback(async (input: InstallmentInput) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error: err } = await supabase
      .from('installments')
      .insert({ ...input, user_id: user.id })
      .select()
      .single();

    if (err) throw new Error(err.message);
    setInstallments((prev) => [data as Installment, ...prev]);
    return data as Installment;
  }, []);

  const markPaid = useCallback(async (id: string) => {
    const current = installments.find((i) => i.id === id);
    if (!current) return;

    const newPaid = current.paid_months + 1;
    const isDone  = newPaid >= current.total_months;

    const { data, error: err } = await supabase
      .from('installments')
      .update({ paid_months: newPaid, is_active: !isDone })
      .eq('id', id)
      .select()
      .single();

    if (err) throw new Error(err.message);
    setInstallments((prev) =>
      isDone
        ? prev.filter((i) => i.id !== id)
        : prev.map((i) => (i.id === id ? (data as Installment) : i))
    );
  }, [installments]);

  const remove = useCallback(async (id: string) => {
    const { error: err } = await supabase
      .from('installments')
      .update({ is_active: false })
      .eq('id', id);

    if (err) throw new Error(err.message);
    setInstallments((prev) => prev.filter((i) => i.id !== id));
  }, []);

  /** Total monthly amount across all active installments */
  const totalMonthlyDue = installments.reduce((sum, i) => sum + i.monthly_amount, 0);

  return { installments, loading, error, totalMonthlyDue, refetch: fetch, create, markPaid, remove };
}
