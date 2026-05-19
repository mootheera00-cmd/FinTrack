import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

export function useProfile() {
  const [profile, setProfile]   = useState<Profile | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data, error: err } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!active) return;
      if (err) setError(err.message);
      else setProfile(data as Profile);
      setLoading(false);
    }

    void load();
    return () => { active = false; };
  }, []);

  const updateProfile = async (patch: Partial<Pick<Profile, 'display_name' | 'monthly_income' | 'liquid_cash' | 'currency'>>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error: err } = await supabase
      .from('profiles')
      .update(patch)
      .eq('id', user.id)
      .select()
      .single();

    if (err) throw new Error(err.message);
    setProfile(data as Profile);
    return data as Profile;
  };

  return { profile, loading, error, updateProfile };
}
