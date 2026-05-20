import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useInstallments } from '@/hooks/useInstallments';
import { todayISO } from '@/lib/utils';
import type { CreditCard } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  cards: CreditCard[];
  defaultCardId?: string;
}

export function AddInstallmentModal({ open, onClose, cards, defaultCardId }: Props) {
  const { create } = useInstallments();

  const activeCards = cards.filter((c) => c.is_active);

  const [cardId, setCardId]           = useState('');
  const [description, setDescription] = useState('');
  const [totalAmount, setTotal]       = useState('');
  const [totalMonths, setMonths]      = useState('');
  const [monthlyAmount, setMonthly]   = useState('');
  const [startDate, setStart]         = useState(todayISO());
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');

  // Auto-select defaultCardId when opened
  useEffect(() => {
    if (open) {
      setCardId(defaultCardId ?? (activeCards.length > 0 ? activeCards[0].id : ''));
    }
  }, [open, defaultCardId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-calculate monthly from total/months
  useEffect(() => {
    const t = parseFloat(totalAmount);
    const m = parseInt(totalMonths);
    if (t > 0 && m > 0) {
      setMonthly((t / m).toFixed(2));
    }
  }, [totalAmount, totalMonths]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cardId) { setError('กรุณาเลือกบัตรเครดิต'); return; }
    if (!description.trim()) { setError('กรุณากรอกรายละเอียด'); return; }
    const total   = parseFloat(totalAmount);
    const monthly = parseFloat(monthlyAmount);
    const months  = parseInt(totalMonths);
    if (!total || total <= 0)   { setError('กรุณากรอกยอดรวม'); return; }
    if (!monthly || monthly <= 0) { setError('กรุณากรอกค่างวด'); return; }
    if (!months || months < 1)  { setError('กรุณากรอกจำนวนงวด'); return; }

    setSaving(true);
    setError('');
    try {
      await create({
        credit_card_id: cardId,
        description:    description.trim(),
        total_amount:   total,
        monthly_amount: monthly,
        total_months:   months,
        paid_months:    0,
        start_date:     startDate,
        is_active:      true,
      });
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    setDescription(''); setTotal(''); setMonths('');
    setMonthly(''); setStart(todayISO()); setError('');
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="เพิ่มการผ่อนชำระ">
      <form onSubmit={handleSubmit} className="px-5 py-4 space-y-5">

        {/* Card selector */}
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
            บัตรเครดิต *
          </label>
          {activeCards.length === 0 ? (
            <p className="text-sm text-slate-500 bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
              ยังไม่มีบัตร กรุณาเพิ่มบัตรก่อน
            </p>
          ) : (
            <select
              value={cardId}
              onChange={(e) => setCardId(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400 appearance-none"
            >
              {activeCards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.card_name}{card.last_four ? ` (•••• ${card.last_four})` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
            รายละเอียด *
          </label>
          <input
            type="text"
            placeholder="เช่น iPhone 16 Pro, ตู้เย็น Samsung"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400"
          />
        </div>

        {/* Total amount + Months → Auto calculate monthly */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
              ยอดรวม (บาท) *
            </label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="30000"
              value={totalAmount}
              onChange={(e) => setTotal(e.target.value)}
              required
              min="0.01"
              step="0.01"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
              จำนวนงวด *
            </label>
            <input
              type="number"
              inputMode="numeric"
              placeholder="12"
              value={totalMonths}
              onChange={(e) => setMonths(e.target.value)}
              required
              min="1"
              step="1"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400"
            />
          </div>
        </div>

        {/* Monthly (editable, auto-filled) */}
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
            ค่างวด / เดือน (บาท) *
          </label>
          <input
            type="number"
            inputMode="decimal"
            placeholder="2500"
            value={monthlyAmount}
            onChange={(e) => setMonthly(e.target.value)}
            required
            min="0.01"
            step="0.01"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400"
          />
          {totalAmount && totalMonths && (
            <p className="text-xs text-slate-400 mt-1 px-1">คำนวณจาก {totalAmount} ÷ {totalMonths} งวด</p>
          )}
        </div>

        {/* Start date */}
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
            วันที่เริ่มต้น
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStart(e.target.value)}
            required
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400"
          />
        </div>

        {error && (
          <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
            ⚠️ {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving || activeCards.length === 0}
          className="w-full py-4 rounded-2xl bg-brand-500 hover:bg-brand-600 active:scale-[0.98] text-white font-bold text-base transition-all disabled:opacity-60 shadow-sm"
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              กำลังบันทึก...
            </span>
          ) : 'เพิ่มการผ่อน'}
        </button>

        <div className="h-4" />
      </form>
    </Modal>
  );
}
