import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useCreditCards } from '@/hooks/useCreditCards';

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#06b6d4', '#64748b', '#1e293b',
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AddCardModal({ open, onClose }: Props) {
  const { create } = useCreditCards();

  const [cardName, setCardName]     = useState('');
  const [bank, setBank]             = useState('');
  const [lastFour, setLastFour]     = useState('');
  const [statementDay, setStmt]     = useState('1');
  const [dueDay, setDue]            = useState('15');
  const [creditLimit, setCreditLimit] = useState('');
  const [color, setColor]           = useState(PRESET_COLORS[0]);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cardName.trim()) { setError('กรุณากรอกชื่อบัตร'); return; }
    const stmt = parseInt(statementDay);
    const due  = parseInt(dueDay);
    if (isNaN(stmt) || stmt < 1 || stmt > 31) { setError('วันตัดบัญชีต้องอยู่ระหว่าง 1-31'); return; }
    if (isNaN(due) || due < 1 || due > 31)  { setError('วันครบกำหนดต้องอยู่ระหว่าง 1-31'); return; }

    setSaving(true);
    setError('');
    try {
      await create({
        card_name:     cardName.trim(),
        bank:          bank.trim() || null,
        last_four:     lastFour.trim() || null,
        statement_day: stmt,
        due_day:       due,
        credit_limit:  creditLimit ? parseFloat(creditLimit) : null,
        color,
        is_active:     true,
      });
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    setCardName(''); setBank(''); setLastFour('');
    setStmt('1'); setDue('15'); setCreditLimit('');
    setColor(PRESET_COLORS[0]); setError('');
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="เพิ่มบัตรเครดิต">
      <form onSubmit={handleSubmit} className="px-5 py-4 space-y-5">

        {/* Card preview */}
        <div
          className="relative rounded-2xl p-5 h-28 overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${color}cc, ${color}44)` }}
        >
          <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10 blur-xl" />
          <p className="text-white font-bold text-lg">{cardName || 'ชื่อบัตร'}</p>
          <p className="text-white/60 text-sm mt-0.5">{bank || 'ธนาคาร'}</p>
          {lastFour && <p className="text-white/70 font-mono text-sm mt-2">•••• {lastFour}</p>}
        </div>

        {/* Color picker */}
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">
            สีบัตร
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-9 h-9 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-slate-700 scale-110' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Card name */}
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
            ชื่อบัตร *
          </label>
          <input
            type="text"
            placeholder="เช่น KBank Platinum"
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            required
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400"
          />
        </div>

        {/* Bank + Last 4 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
              ธนาคาร
            </label>
            <input
              type="text"
              placeholder="KBank"
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
              เลข 4 หลักท้าย
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              placeholder="1234"
              value={lastFour}
              onChange={(e) => setLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400 font-mono"
            />
          </div>
        </div>

        {/* Statement day + Due day */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
              วันตัดบัญชี
            </label>
            <input
              type="number"
              inputMode="numeric"
              min={1} max={31}
              placeholder="1"
              value={statementDay}
              onChange={(e) => setStmt(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
              วันครบกำหนด
            </label>
            <input
              type="number"
              inputMode="numeric"
              min={1} max={31}
              placeholder="15"
              value={dueDay}
              onChange={(e) => setDue(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400"
            />
          </div>
        </div>

        {/* Credit limit */}
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
            วงเงินบัตร (ไม่บังคับ)
          </label>
          <input
            type="number"
            inputMode="decimal"
            placeholder="50000"
            value={creditLimit}
            onChange={(e) => setCreditLimit(e.target.value)}
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
          ) : 'เพิ่มบัตร'}
        </button>

        <div className="h-4" />
      </form>
    </Modal>
  );
}
