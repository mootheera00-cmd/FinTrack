import { useState } from 'react';
import { Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
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

export default function IncomePage() {
  const ctx = useData();
  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [modalMonth, setModalMonth] = useState(currentMonthKey());
  const [saving, setSaving] = useState(false);

  const monthIncomes = ctx.incomes.filter(i => i.month_key === monthKey);
  const total = monthIncomes.reduce((s, i) => s + i.amount, 0);

  const openModal = () => {
    setName('');
    setAmount('');
    setModalMonth(monthKey);
    setShowModal(true);
  };

  const handleSave = async () => {
    const amt = parseFloat(amount);
    if (!name.trim() || isNaN(amt) || amt <= 0) return;
    setSaving(true);
    try {
      await ctx.createIncome({ name: name.trim(), amount: amt, month_key: modalMonth });
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
          <h1 className="text-xl font-bold text-slate-900">💰 รายรับ</h1>
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

        {/* Total card */}
        <div className="rounded-2xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 p-4 mb-4">
          <p className="text-xs text-slate-500 mb-1">รายรับรวม</p>
          <p className="text-2xl font-bold text-emerald-600 tabular-nums">{formatCurrency(total)}</p>
          <p className="text-xs text-slate-400 mt-1">{monthIncomes.length} รายการ</p>
        </div>

        {/* Income list */}
        {ctx.loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : monthIncomes.length === 0 ? (
          <div className="text-center text-slate-400 py-16">
            <p className="text-4xl mb-3">💰</p>
            <p>ยังไม่มีรายรับในเดือนนี้</p>
          </div>
        ) : (
          <div className="space-y-3">
            {monthIncomes.map(inc => (
              <Card key={inc.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{inc.name}</p>
                </div>
                <p className="font-bold text-emerald-600 tabular-nums shrink-0">
                  {formatCurrency(inc.amount)}
                </p>
                <button
                  onClick={() => ctx.deleteIncome(inc.id)}
                  className="shrink-0 text-slate-300 hover:text-rose-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="เพิ่มรายรับ">
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
              ชื่อรายรับ
            </label>
            <input
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="เช่น เงินเดือน, ฟรีแลนซ์"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
              จำนวนเงิน (บาท)
            </label>
            <input
              type="number"
              min="0"
              inputMode="decimal"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
              เดือน
            </label>
            <div className="flex items-center border border-slate-200 rounded-xl px-4 py-2.5">
              <button
                onClick={() => setModalMonth(k => advanceMonthKey(k, -1))}
                className="text-slate-500"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="flex-1 text-center font-medium text-slate-900">
                {formatMonthKeyThai(modalMonth)}
              </span>
              <button
                onClick={() => setModalMonth(k => advanceMonthKey(k, 1))}
                className="text-slate-500"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <Button fullWidth loading={saving} onClick={handleSave}>
            บันทึก
          </Button>
        </div>
      </Modal>
    </Layout>
  );
}
