import { useState } from 'react';
import { Plus, Trash2, Pencil, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
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
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [editTarget, setEditTarget] = useState<typeof ctx.incomes[0] | null>(null);

  const monthIncomes = ctx.incomes.filter(i => i.month_key === monthKey);
  const total = monthIncomes.reduce((s, i) => s + i.amount, 0);

  const openModal = (inc?: typeof ctx.incomes[0]) => {
    if (inc) {
      setEditTarget(inc);
      setName(inc.name);
      setAmount(String(inc.amount));
      setModalMonth(inc.month_key);
    } else {
      setEditTarget(null);
      setName('');
      setAmount('');
      setModalMonth(monthKey);
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    const amt = parseFloat(amount);
    if (!name.trim() || isNaN(amt) || amt <= 0) return;
    setSaving(true);
    try {
      if (editTarget) {
        await ctx.updateIncome({ id: editTarget.id, name: name.trim(), amount: amt, month_key: modalMonth });
      } else {
        await ctx.createIncome({ name: name.trim(), amount: amt, month_key: modalMonth });
      }
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout monthKey={monthKey} onMonthChange={setMonthKey}>
      <div className="px-4 pt-6 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-neutral-900 flex items-center gap-2"><TrendingUp size={20} className="text-neutral-500" /> รายรับ</h1>
          <button
            onClick={() => openModal()}
            className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center shadow-md active:scale-95"
          >
            <Plus size={20} className="text-white" />
          </button>
        </div>

        {/* Total card */}
        <div className="rounded-2xl bg-neutral-50 border border-neutral-200 p-4 mb-4">
          <p className="text-xs text-neutral-500 mb-1">รายรับรวม</p>
          <p className="text-xl font-bold text-neutral-700 tabular-nums">{formatCurrency(total)}</p>
          <p className="text-xs text-neutral-400 mt-1">{monthIncomes.length} รายการ</p>
        </div>

        {/* Income list */}
        {ctx.loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-neutral-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : monthIncomes.length === 0 ? (
          <div className="text-center text-neutral-400 py-16">
            <TrendingUp size={36} className="text-neutral-300 mx-auto mb-3" />
            <p>ยังไม่มีรายรับในเดือนนี้</p>
          </div>
        ) : (
          <div className="space-y-3">
            {monthIncomes.map(inc => (
              <Card key={inc.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-neutral-900 truncate">{inc.name}</p>
                </div>
                <p className="font-bold text-neutral-700 tabular-nums shrink-0">
                  {formatCurrency(inc.amount)}
                </p>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openModal(inc)}
                    className="text-neutral-300 hover:text-neutral-700 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget({ id: inc.id, name: inc.name })}
                    className="text-neutral-300 hover:text-neutral-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="ลบรายรับ"
        message={`ต้องการลบ "${deleteTarget?.name ?? ''}" ใช่หรือไม่?`}
        onConfirm={() => {
          if (deleteTarget) ctx.deleteIncome(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editTarget ? 'แก้ไขรายรับ' : 'เพิ่มรายรับ'}>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">
              ชื่อรายการ
            </label>
            <input
              className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400"
              placeholder="เช่น เงินเดือน, ฟรีแลนซ์"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">
              จำนวนเงิน (บาท)
            </label>
            <input
              type="number"
              min="0"
              inputMode="decimal"
              className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">
              เดือน
            </label>
            <div className="flex items-center border border-neutral-200 rounded-xl px-4 py-2.5">
              <button
                onClick={() => setModalMonth(k => advanceMonthKey(k, -1))}
                className="text-neutral-500"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="flex-1 text-center font-medium text-neutral-900">
                {formatMonthKeyThai(modalMonth)}
              </span>
              <button
                onClick={() => setModalMonth(k => advanceMonthKey(k, 1))}
                className="text-neutral-500"
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
