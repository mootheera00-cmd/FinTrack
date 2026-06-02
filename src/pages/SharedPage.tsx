import { useState } from 'react';
import { Plus, Trash2, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useData } from '@/hooks/useData';
import {
  formatCurrency,
  currentMonthKey,
  advanceMonthKey,
  formatMonthKeyThai,
} from '@/lib/utils';

export default function SharedPage() {
  const ctx = useData();
  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const [showModal, setShowModal] = useState(false);
  const [desc, setDesc] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [splitCount, setSplitCount] = useState('2');
  const [modalMonth, setModalMonth] = useState(currentMonthKey());
  const [includeInExpenses, setIncludeInExpenses] = useState(false);
  const [saving, setSaving] = useState(false);

  const monthShared = ctx.sharedExpenses.filter(s => s.month_key === monthKey);
  const myShareTotal = monthShared.reduce((s, e) => s + e.my_share, 0);
  const includedTotal = monthShared
    .filter(s => s.include_in_expenses)
    .reduce((s, e) => s + e.my_share, 0);

  const computedMyShare = () => {
    const ta = parseFloat(totalAmount);
    const sc = parseInt(splitCount);
    if (!isNaN(ta) && !isNaN(sc) && sc >= 2) return ta / sc;
    return 0;
  };

  const openModal = () => {
    setDesc('');
    setTotalAmount('');
    setSplitCount('2');
    setModalMonth(monthKey);
    setIncludeInExpenses(false);
    setShowModal(true);
  };

  const handleSave = async () => {
    const ta = parseFloat(totalAmount);
    const sc = parseInt(splitCount);
    if (!desc.trim() || isNaN(ta) || ta <= 0 || isNaN(sc) || sc < 2) return;
    const myShare = ta / sc;
    setSaving(true);
    try {
      await ctx.createSharedExpense({
        description: desc.trim(),
        total_amount: ta,
        split_count: sc,
        my_share: myShare,
        month_key: modalMonth,
        include_in_expenses: includeInExpenses,
      });
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="px-4 pt-6 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-slate-900">🤝 ซื้อร่วม</h1>
          <button
            onClick={openModal}
            className="w-10 h-10 rounded-full bg-brand-400 flex items-center justify-center shadow-md active:scale-95"
          >
            <Plus size={20} className="text-slate-900" />
          </button>
        </div>

        {/* Month picker */}
        <div className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 mb-4 border border-slate-200 shadow-sm">
          <button
            onClick={() => setMonthKey(k => advanceMonthKey(k, -1))}
            className="p-1 text-slate-500 hover:text-slate-900"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="font-semibold text-slate-900">{formatMonthKeyThai(monthKey)}</span>
          <button
            onClick={() => setMonthKey(k => advanceMonthKey(k, 1))}
            className="p-1 text-slate-500 hover:text-slate-900"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-2xl bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 p-4">
            <p className="text-xs text-slate-500 mb-1">ส่วนของฉันรวม</p>
            <p className="text-lg font-bold text-purple-700 tabular-nums">{formatCurrency(myShareTotal)}</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-r from-rose-50 to-red-50 border border-rose-200 p-4">
            <p className="text-xs text-slate-500 mb-1">นับเป็นรายจ่าย</p>
            <p className="text-lg font-bold text-rose-600 tabular-nums">{formatCurrency(includedTotal)}</p>
          </div>
        </div>

        {/* List */}
        {ctx.loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : monthShared.length === 0 ? (
          <div className="text-center text-slate-400 py-16">
            <p className="text-4xl mb-3">🤝</p>
            <p>ยังไม่มีรายการซื้อร่วมในเดือนนี้</p>
          </div>
        ) : (
          <div className="space-y-3">
            {monthShared.map(se => (
              <Card key={se.id} className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{se.description}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                      <Users size={12} />
                      <span>แบ่ง {se.split_count} คน • รวม {formatCurrency(se.total_amount)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => ctx.deleteSharedExpense(se.id)}
                    className="text-slate-300 hover:text-rose-500 transition-colors ml-2 shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">ส่วนของฉัน</p>
                    <p className="text-lg font-bold text-purple-700 tabular-nums">
                      {formatCurrency(se.my_share)}
                    </p>
                  </div>
                  <button
                    onClick={() => ctx.toggleSharedInclude(se.id, !se.include_in_expenses)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                      se.include_in_expenses
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {se.include_in_expenses ? '✅ รวมรายจ่ายแล้ว' : '+ รวมเป็นรายจ่าย'}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="เพิ่มรายการซื้อร่วม">
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
              รายการ
            </label>
            <input
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="เช่น ค่าอาหารเย็น, ค่าเดินทาง"
              value={desc}
              onChange={e => setDesc(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                ยอดรวม (บาท)
              </label>
              <input
                type="number"
                min="0"
                inputMode="decimal"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
                placeholder="0.00"
                value={totalAmount}
                onChange={e => setTotalAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                จำนวนคน
              </label>
              <input
                type="number"
                min="2"
                inputMode="numeric"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
                placeholder="2"
                value={splitCount}
                onChange={e => setSplitCount(e.target.value)}
              />
            </div>
          </div>

          {/* Preview */}
          {computedMyShare() > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3">
              <p className="text-xs text-slate-500">ส่วนของฉัน</p>
              <p className="text-xl font-bold text-purple-700 tabular-nums">
                {formatCurrency(computedMyShare())}
              </p>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
              เดือน
            </label>
            <div className="flex items-center border border-slate-200 rounded-xl px-4 py-2.5">
              <button onClick={() => setModalMonth(k => advanceMonthKey(k, -1))} className="text-slate-500">
                <ChevronLeft size={16} />
              </button>
              <span className="flex-1 text-center font-medium text-slate-900">
                {formatMonthKeyThai(modalMonth)}
              </span>
              <button onClick={() => setModalMonth(k => advanceMonthKey(k, 1))} className="text-slate-500">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <button
            onClick={() => setIncludeInExpenses(v => !v)}
            className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-colors ${
              includeInExpenses
                ? 'bg-rose-50 border-rose-300 text-rose-700'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
          >
            <span>{includeInExpenses ? '✅' : '☐'}</span>
            <span className="text-sm font-medium">รวมเข้ารายจ่ายของฉันด้วย</span>
          </button>

          <Button fullWidth loading={saving} onClick={handleSave}>
            บันทึก
          </Button>
        </div>
      </Modal>
    </Layout>
  );
}
