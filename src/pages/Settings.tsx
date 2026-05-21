import React, { useState } from 'react';
import { User, DollarSign, Wallet, Bell, Moon, ChevronRight, LogOut } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/lib/supabase';

interface SettingRowProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onClick?: () => void;
  iconBg?: string;
}

function SettingRow({ icon, label, value, onClick, iconBg = 'bg-slate-500/15' }: SettingRowProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full px-4 py-3 hover:bg-slate-50 transition-colors active:bg-slate-100 text-left"
    >
      <span className={`p-2 rounded-xl ${iconBg}`}>{icon}</span>
      <span className="flex-1 text-sm font-medium text-slate-900">{label}</span>
      {value && <span className="text-xs text-slate-500 mr-1">{value}</span>}
      <ChevronRight size={16} className="text-slate-500 shrink-0" />
    </button>
  );
}

export default function Settings() {
  const { profile, updateProfile } = useProfile();
  const [incomeInput, setIncomeInput]     = useState('');
  const [cashInput, setCashInput]         = useState('');
  const [saving, setSaving]               = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        monthly_income: incomeInput ? parseFloat(incomeInput) : undefined,
        liquid_cash:    cashInput   ? parseFloat(cashInput)   : undefined,
      });
    } finally {
      setSaving(false);
      setIncomeInput('');
      setCashInput('');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // useAuth in App.tsx detects session change and redirects to AuthPage automatically
  };

  return (
    <Layout>
      <Header title="Settings" />

      <div className="p-4 pb-6 space-y-4">
        {/* Profile info */}
        <Card className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-brand-50 border-2 border-brand-200 flex items-center justify-center shrink-0">
            <User size={26} className="text-brand-400" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">{profile?.display_name ?? '—'}</p>
            <p className="text-xs text-slate-500">Currency: {profile?.currency ?? 'THB'}</p>
          </div>
        </Card>

        {/* Financial settings */}
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider px-1 mb-2">Financial Settings</p>
          <Card className="p-0 overflow-hidden divide-y divide-slate-200">
            <div className="px-4 py-3 space-y-2">
              <label className="text-xs text-slate-500 flex items-center gap-2">
                <DollarSign size={14} className="text-brand-400" />
                Monthly Income (THB)
              </label>
              <input
                type="number"
                placeholder={String(profile?.monthly_income ?? 0)}
                value={incomeInput}
                onChange={(e) => setIncomeInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                inputMode="decimal"
              />
            </div>
            <div className="px-4 py-3 space-y-2">
              <label className="text-xs text-slate-500 flex items-center gap-2">
                <Wallet size={14} className="text-blue-600" />
                Current Liquid Cash (THB)
              </label>
              <input
                type="number"
                placeholder={String(profile?.liquid_cash ?? 0)}
                value={cashInput}
                onChange={(e) => setCashInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                inputMode="decimal"
              />
            </div>
            <div className="px-4 py-3">
              <Button
                fullWidth
                loading={saving}
                onClick={() => void handleSave()}
                disabled={!incomeInput && !cashInput}
              >
                Save Changes
              </Button>
            </div>
          </Card>
        </div>

        {/* Preferences */}
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider px-1 mb-2">Preferences</p>
          <Card className="p-0 overflow-hidden divide-y divide-slate-200">
            <SettingRow
              icon={<Bell size={16} className="text-amber-500" />}
              iconBg="bg-amber-50"
              label="Bill Reminders"
              value="Off"
            />
            <SettingRow
              icon={<Moon size={16} className="text-blue-600" />}
              iconBg="bg-blue-50"
              label="Dark Mode"
              value="Light"
            />
          </Card>
        </div>

        {/* Danger zone */}
        <Button
          variant="destructive"
          fullWidth
          icon={<LogOut size={16} />}
          onClick={() => void handleSignOut()}
        >
          Sign Out
        </Button>

        <p className="text-center text-xs text-slate-600 pb-2">FinTrack v0.1.0</p>
      </div>
    </Layout>
  );
}
