import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useRecurringExpenses } from '@/hooks/useRecurringExpenses';
import { EXPENSE_CATEGORIES } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AddRecurringModal({ open, onClose }: Props) {
  const { create } = useRecurringExpenses();

  const [description, setDescription] = useState('');
  const [amount, setAmount]           = useState('');
  const [category, setCategory]       = useState('utilities');
  const [dueDay, setDueDay]           = useState('1');
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) { setError('กรุณากรอกรายละเอียด'); return; }
    const amtVal = parseFloat(amount);
    if (!amtVal || amtVal <= 0) { setError('กรุณากรอกจำนวนเงินให้ถูกต้อง'); return; }
    const dayVal = parseInt(dueDay);
    if (!dayVal || dayVal < 1 || dayVal > 31) { setError('กรุณากรอกวันที่ชำระ (1 - 31)'); return; }

    setSaving(true);
    setError('');
    try {
      await create({
        description: description.trim(),
        amount: amtVal,
        category: category as any,
        due_day: dayVal,
        is_active: true,
      });
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    setDescription('');
    setAmount('');
    setCategory('utilities');
    setDueDay('1');
    setError('');
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="เพิ่มรายจ่ายประจำ">
      <form onSubmit={handleSubmit} className="px-5 py-4 space-y-5">
        {/* Description */}
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
            ชื่อรายการรายจ่ายประจำ *
          </label>
          <input
            type="text"
            placeholder="เช่น ค่าหอพัก, Netflix, ค่าเน็ตมือถือ"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400"
          />
        </div>

        {/* Amount */}
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
            จำนวนเงิน (บาท) *
          </label>
          <input
            type="number"
            inputMode="decimal"
            placeholder="เช่น 290, 8000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            min="0.01"
            step="0.01"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400"
          />
        </div>

        {/* Category */}
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
            หมวดหมู่
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400 appearance-none"
          >
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Due Day */}
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
            วันที่หักค่าใช้จ่ายของทุกเดือน (1-31) *
          </label>
          <input
            type="number"
            inputMode="numeric"
            placeholder="เช่น 5 (ทุกวันที่ 5 ของเดือน)"
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
            required
            min="1"
            max="31"
            step="1"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400"
          />
        </div>

        {error && (
          <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
            ⚠️ {error}
          </p>
        )}

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
          ) : 'บันทึกรายจ่ายประจำ'}
        </button>

        <div className="h-4" />
      </form>
    </Modal>
  );
}
