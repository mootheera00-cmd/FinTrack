import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useTransactions } from '@/hooks/useTransactions';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@/types';
import { todayISO } from '@/lib/utils';
import type { TransactionType, TransactionCategory } from '@/types';

const CATEGORY_EMOJI: Record<string, string> = {
  salary: '💼', freelance: '💻', investment: '📈', other_income: '💰',
  food: '🍜', transport: '🚗', shopping: '🛍️', entertainment: '🎬',
  utilities: '💡', health: '🏥', education: '📚', travel: '✈️', other_expense: '📦',
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AddTransactionModal({ open, onClose }: Props) {
  const { create } = useTransactions();

  const [type, setType]           = useState<TransactionType>('expense');
  const [category, setCategory]   = useState<TransactionCategory>('food');
  const [amount, setAmount]       = useState('');
  const [note, setNote]           = useState('');
  const [date, setDate]           = useState(todayISO());
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  // Reset category when type changes
  function switchType(t: TransactionType) {
    setType(t);
    setCategory(t === 'income' ? 'salary' : 'food');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      setError('กรุณากรอกจำนวนเงิน');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await create({ type, category, amount: parseFloat(amount), note: note || null, txn_date: date });
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    setAmount('');
    setNote('');
    setDate(todayISO());
    setError('');
    setType('expense');
    setCategory('food');
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="เพิ่มรายการ">
      <form onSubmit={handleSubmit} className="px-5 py-4 space-y-5">

        {/* Type Toggle */}
        <div className="flex rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
          {(['expense', 'income'] as TransactionType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => switchType(t)}
              className={`flex-1 py-3 text-sm font-semibold transition-all ${
                type === t
                  ? t === 'income'
                    ? 'bg-brand-500 text-white'
                    : 'bg-rose-500 text-white'
                  : 'text-slate-500'
              }`}
            >
              {t === 'income' ? '💚 รายรับ' : '🔴 รายจ่าย'}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
            จำนวนเงิน (บาท)
          </label>
          <input
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            min="0.01"
            step="0.01"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-2xl font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400"
          />
        </div>

        {/* Category */}
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">
            หมวดหมู่
          </label>
          <div className="grid grid-cols-3 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border text-xs font-medium transition-all ${
                  category === cat.value
                    ? 'border-brand-400 bg-brand-50 text-brand-600'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="text-xl">{CATEGORY_EMOJI[cat.value]}</span>
                <span className="leading-tight text-center">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
            วันที่
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400"
          />
        </div>

        {/* Note */}
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
            หมายเหตุ (ไม่บังคับ)
          </label>
          <input
            type="text"
            placeholder="เช่น ค่าข้าวกลางวัน"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400"
          />
        </div>

        {error && (
          <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
            ⚠️ {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-4 rounded-2xl bg-brand-500 hover:bg-brand-600 active:scale-[0.98] text-white font-bold text-base transition-all disabled:opacity-60 shadow-sm"
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              กำลังบันทึก...
            </span>
          ) : 'บันทึกรายการ'}
        </button>

        <div className="h-4" />
      </form>
    </Modal>
  );
}
