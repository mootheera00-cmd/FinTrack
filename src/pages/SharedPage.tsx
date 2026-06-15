import { useState } from 'react';
import { Plus, Trash2, Pencil, ChevronLeft, ChevronRight, Users, Check } from 'lucide-react';
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
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [editTarget, setEditTarget] = useState<typeof ctx.sharedExpenses[0] | null>(null);

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

  const openModal = (se?: typeof ctx.sharedExpenses[0]) => {
    if (se) {
      setEditTarget(se);
      setDesc(se.description);
      setTotalAmount(String(se.total_amount));
      setSplitCount(String(se.split_count));
      setModalMonth(se.month_key);
      setIncludeInExpenses(se.include_in_expenses);
    } else {
      setEditTarget(null);
      setDesc('');
      setTotalAmount('');
      setSplitCount('2');
      setModalMonth(monthKey);
      setIncludeInExpenses(false);
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    const ta = parseFloat(totalAmount);
    const sc = parseInt(splitCount);
    if (!desc.trim() || isNaN(ta) || ta <= 0 || isNaN(sc) || sc < 2) return;
    const myShare = ta / sc;
    setSaving(true);
    try {
      if (editTarget) {
        await ctx.updateSharedExpense({
          id: editTarget.id,
          description: desc.trim(),
          total_amount: ta,
          split_count: sc,
          my_share: myShare,
          month_key: modalMonth,
          include_in_expenses: includeInExpenses,
        });
      } else {
        await ctx.createSharedExpense({
          description: desc.trim(),
          total_amount: ta,
          split_count: sc,
          my_share: myShare,
          month_key: modalMonth,
          include_in_expenses: includeInExpenses,
        });
      }
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <Layout monthKey={monthKey} onMonthChange={setMonthKey}>
      <div className="px-4 pt-6 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-neutral-900 flex items-center gap-2"><Users size={20} className="text-neutral-500" /> ซื้อร่วม</h1>
          <button
            onClick={() => openModal()}
            className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center shadow-md active:scale-95"
          >
            <Plus size={20} className="text-white" />
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-2xl bg-neutral-50 border border-neutral-200 p-4">
            <p className="text-xs text-neutral-500 mb-1">ส่วนของฉันรวม</p>
            <p className="text-lg font-bold text-neutral-700 tabular-nums">{formatCurrency(myShareTotal)}</p>
          </div>
          <div className="rounded-2xl bg-neutral-50 border border-neutral-200 p-4">
            <p className="text-xs text-neutral-500 mb-1">นับเป็นรายจ่าย</p>
            <p className="text-lg font-bold text-neutral-600 tabular-nums">{formatCurrency(includedTotal)}</p>
          </div>
        </div>

        {/* List */}
        {ctx.loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-24 bg-neutral-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : monthShared.length === 0 ? (
          <div className="text-center text-neutral-400 py-16">
            <Users size={48} className="text-neutral-300 mx-auto mb-3" />
            <p>ยังไม่มีรายการซื้อร่วมในเดือนนี้</p>
          </div>
        ) : (
          <div className="space-y-3">
            {monthShared.map(se => (
              <Card key={se.id} className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-neutral-900 truncate">{se.description}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-400">
                      <Users size={12} />
                      <span>แบ่ง {se.split_count} คน • รวม {formatCurrency(se.total_amount)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2 shrink-0">
                  <button
                    onClick={() => openModal(se)}
                    className="text-neutral-300 hover:text-neutral-700 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget({ id: se.id, name: se.description })}
                    className="text-neutral-300 hover:text-neutral-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-neutral-400">ส่วนของฉัน</p>
                    <p className="text-lg font-bold text-neutral-700 tabular-nums">
                      {formatCurrency(se.my_share)}
                    </p>
                  </div>
                  <button
                    onClick={() => ctx.toggleSharedInclude(se.id, !se.include_in_expenses)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                      se.include_in_expenses
                        ? 'bg-neutral-100 text-neutral-700'
                        : 'bg-neutral-100 text-neutral-500'
                    }`}
                  >
                    {se.include_in_expenses ? 'รวมรายจ่ายแล้ว' : '+ รวมเป็นรายจ่าย'}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editTarget ? 'แก้ไขรายการซื้อร่วม' : 'เพิ่มรายการซื้อร่วม'}>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">
              รายการ
            </label>
            <input
              className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400"
              placeholder="เช่น ค่าอาหารเย็น, ค่าเดินทาง"
              value={desc}
              onChange={e => setDesc(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">
                ยอดรวม (บาท)
              </label>
              <input
                type="number"
                min="0"
                inputMode="decimal"
                className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                placeholder="0.00"
                value={totalAmount}
                onChange={e => setTotalAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">
                จำนวนคน
              </label>
              <input
                type="number"
                min="2"
                inputMode="numeric"
                className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                placeholder="2"
                value={splitCount}
                onChange={e => setSplitCount(e.target.value)}
              />
            </div>
          </div>

          {/* Preview */}
          {computedMyShare() > 0 && (
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3">
              <p className="text-xs text-neutral-500">ส่วนของฉัน</p>
              <p className="text-xl font-bold text-neutral-700 tabular-nums">
                {formatCurrency(computedMyShare())}
              </p>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">
              เดือน
            </label>
            <div className="flex items-center border border-neutral-200 rounded-xl px-4 py-2.5">
              <button onClick={() => setModalMonth(k => advanceMonthKey(k, -1))} className="text-neutral-500">
                <ChevronLeft size={16} />
              </button>
              <span className="flex-1 text-center font-medium text-neutral-900">
                {formatMonthKeyThai(modalMonth)}
              </span>
              <button onClick={() => setModalMonth(k => advanceMonthKey(k, 1))} className="text-neutral-500">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <button
            onClick={() => setIncludeInExpenses(v => !v)}
            className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-colors ${
              includeInExpenses
                ? 'bg-neutral-100 border-neutral-300 text-neutral-700'
                : 'bg-neutral-50 border-neutral-200 text-neutral-500'
            }`}
          >
            <span className="text-sm font-medium">รวมเข้ารายจ่ายของฉันด้วย</span>
          </button>

          <Button fullWidth loading={saving} onClick={handleSave}>
            บันทึก
          </Button>
        </div>
      </Modal>
      </Layout>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="ลบซื้อร่วม"
        message={`ต้องการลบ "${deleteTarget?.name ?? ''}" ใช่หรือไม่?`}
        onConfirm={() => {
          if (deleteTarget) ctx.deleteSharedExpense(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
