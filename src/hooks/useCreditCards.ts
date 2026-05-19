import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { CreditCard, CreditCardInput } from '@/types';

export function useCreditCards() {
  const [cards, setCards]     = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('credit_cards')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (err) setError(err.message);
    else setCards((data as CreditCard[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void fetch(); }, [fetch]);

  const create = useCallback(async (input: CreditCardInput) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error: err } = await supabase
      .from('credit_cards')
      .insert({ ...input, user_id: user.id })
      .select()
      .single();

    if (err) throw new Error(err.message);
    setCards((prev) => [...prev, data as CreditCard]);
    return data as CreditCard;
  }, []);

  const update = useCallback(async (id: string, patch: Partial<CreditCardInput>) => {
    const { data, error: err } = await supabase
      .from('credit_cards')
      .update(patch)
      .eq('id', id)
      .select()
      .single();

    if (err) throw new Error(err.message);
    setCards((prev) => prev.map((c) => (c.id === id ? (data as CreditCard) : c)));
    return data as CreditCard;
  }, []);

  const remove = useCallback(async (id: string) => {
    // Soft-delete: set is_active = false
    const { error: err } = await supabase
      .from('credit_cards')
      .update({ is_active: false })
      .eq('id', id);

    if (err) throw new Error(err.message);
    setCards((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { cards, loading, error, refetch: fetch, create, update, remove };
}
