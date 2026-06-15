import { useState, useMemo } from 'react';
import { Plus, Trash2, Pencil, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
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

/** Months elapsed from `from` month key to `to` month key */
function monthsBetween(from: string, to: string): number {
  const [y1, m1] = from.split('-').map(Number);
  const [y2, m2] = to.split('-').map(Number);
  return (y2 - y1) * 12 + (m2 - m1);
}

/** Advance a YYYY-MM key by n months and return the key */
function addMonths(mk: string, n: number): string {
  const [y, m] = mk.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function InstallmentsPage() {
  const now = currentMonthKey();
  const ctx = useData();
  const [showModal, setShowModal] = useState(false);
  const [desc, setDesc] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [totalMonths, setTotalMonths] = useState('');
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [startMonth, setStartMonth] = useState(currentMonthKey());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [editTarget, setEditTarget] = useState<typeof ctx.installments[0] | null>(null);

  // Compute auto-paid months — payment triggers on the 28th of each month
  const installmentsWithAuto = useMemo(() => {
    const today = new Date();
    const dayOfMonth = today.getDate();
    return ctx.installments.map(inst => {
      const elapsed = monthsBetween(inst.start_month, now);
      // If today is before the 28th, this month's payment hasn't triggered yet
      const triggeredMonths = dayOfMonth >= 28 ? elapsed + 1 : elapsed;
      const autoPaid = Math.min(Math.max(triggeredMonths, 0), inst.total_months);
      return { ...inst, autoPaid };
    });
  }, [ctx.installments, now]);

  // Active installments: autoPaid < total_months
  const activeInstallments = installmentsWithAuto.filter(
    i => i.autoPaid < i.total_months
  );

  // Total monthly payment
  const totalMonthly = activeInstallments.reduce((s, i) => s + i.monthly_amount, 0);

  const openModal = (inst?: typeof ctx.installments[0]) => {
    if (inst) {
      setEditTarget(inst);
      setDesc(inst.description);
      setTotalPrice(String(inst.total_price));
      setTotalMonths(String(inst.total_months));
      setMonthlyAmount(String(inst.monthly_amount));
      setStartMonth(inst.start_month);
    } else {
      setEditTarget(null);
      setDesc('');
      setTotalPrice('');
      setTotalMonths('');
      setMonthlyAmount('');
      setStartMonth(currentMonthKey());
    }
    setShowModal(true);
  };

  // Auto-calculate monthly amount
  const handleTotalPriceOrMonths = (tp: string, tm: string) => {
    const p = parseFloat(tp);
    const m = parseInt(tm);
    if (!isNaN(p) && !isNaN(m) && m > 0) {
      setMonthlyAmount((p / m).toFixed(2));
    }
  };

  const handleSave = async () => {
    const tp = parseFloat(totalPrice);
    const tm = parseInt(totalMonths);
    const ma = parseFloat(monthlyAmount);
    if (!desc.trim() || isNaN(tp) || tp <= 0 || isNaN(tm) || tm < 1 || isNaN(ma) || ma <= 0) return;
    setSaving(true);
    try {
      if (editTarget) {
        await ctx.updateInstallment({
          id: editTarget.id,
          description: desc.trim(),
          total_price: tp,
          total_months: tm,
          monthly_amount: ma,
          start_month: startMonth,
        });
      } else {
        await ctx.createInstallment({
          description: desc.trim(),
          total_price: tp,
          total_months: tm,
          monthly_amount: ma,
          start_month: startMonth,
          paid_months: 0,
        });
      }
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <Layout>
      <div className="px-4 pt-6 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-slate-900">📋 ผ่อนชำระ</h1>
          <button
            onClick={() => openModal()}
            className="w-10 h-10 rounded-full bg-brand-400 flex items-center justify-center shadow-md active:scale-95"
          >
            <Plus size={20} className="text-slate-900" />
          </button>
        </div>

        {/* Summary card */}
        <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 mb-4">
          <p className="text-xs text-slate-500 mb-1">ค่างวดรายเดือนรวม</p>
          <p className="text-2xl font-bold text-blue-700 tabular-nums">
            {formatCurrency(totalMonthly)}
          </p>
          <p className="text-xs text-slate-400 mt-1">{activeInstallments.length} รายการที่กำลังผ่อน</p>
        </div>

        {/* Installment list */}
        {ctx.loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : activeInstallments.length === 0 ? (
          <div className="text-center text-slate-400 py-16">
            <p className="text-4xl mb-3">📋</p>
            <p>ไม่มีรายการผ่อนชำระ</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeInstallments.map(inst => {
              const remaining = inst.total_months - inst.autoPaid;
              const progress = inst.total_months > 0
                ? (inst.autoPaid / inst.total_months) * 100
                : 0;
              const nearlyDone = remaining <= 3;
              const endMonth = addMonths(inst.start_month, inst.total_months - 1);
              const remainingBalance = inst.total_price - (inst.monthly_amount * inst.autoPaid);

              return (
                <Card key={inst.id} className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold text-slate-900 truncate">{inst.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-2 shrink-0">
                      <p className="text-[10px] text-slate-400 whitespace-nowrap tabular-nums">
                        28 {formatMonthKeyThai(endMonth, true)}
                      </p>
                      {nearlyDone && (
                        <span className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                          <AlertTriangle size={10} />
                          ใกล้หมด
                        </span>
                      )}
                      <button
                        onClick={() => openModal(inst)}
                        className="text-slate-300 hover:text-blue-500 transition-colors"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: inst.id, name: inst.description })}
                        className="text-slate-300 hover:text-rose-500 transition-colors -mr-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>{inst.autoPaid}/{inst.total_months} งวด</span>
                      <span>{progress.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${nearlyDone ? 'bg-amber-400' : 'bg-blue-500'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <p className="text-xs text-slate-400">ค่างวด/เดือน</p>
                      <p className="font-bold text-blue-700 tabular-nums">
                        {formatCurrency(inst.monthly_amount)}
                      </p>
                      {remainingBalance > 0 && (
                        <p className="text-[10px] text-slate-400 mt-0.5 tabular-nums">
                          คงเหลือ {formatCurrency(remainingBalance)}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-medium">
                      ✓ จ่ายอัตโนมัติ
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Completed installments */}
        {installmentsWithAuto.filter(i => i.autoPaid >= i.total_months).length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              ผ่อนครบแล้ว ✅
            </p>
            <div className="space-y-3">
              {installmentsWithAuto
                .filter(i => i.autoPaid >= i.total_months)
                .map(inst => (
                  <Card key={inst.id} className="opacity-60 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-700">{inst.description}</p>
                      <p className="text-xs text-slate-400">{inst.total_months} งวด • {formatCurrency(inst.total_price)}</p>
                    </div>
                    <button
                      onClick={() => openModal(inst)}
                      className="text-slate-300 hover:text-blue-500 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget({ id: inst.id, name: inst.description })}
                      className="text-slate-300 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </Card>
                ))}
            </div>
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editTarget ? 'แก้ไขรายการผ่อน' : 'เพิ่มรายการผ่อน'}>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
              ชื่อสินค้า / รายการ
            </label>
            <input
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="เช่น โน้ตบุ๊ค, มือถือ"
              value={desc}
              onChange={e => setDesc(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                ราคารวม (บาท)
              </label>
              <input
                type="number"
                min="0"
                inputMode="decimal"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
                placeholder="0.00"
                value={totalPrice}
                onChange={e => {
                  setTotalPrice(e.target.value);
                  handleTotalPriceOrMonths(e.target.value, totalMonths);
                }}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                จำนวนงวด
              </label>
              <input
                type="number"
                min="1"
                inputMode="numeric"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
                placeholder="12"
                value={totalMonths}
                onChange={e => {
                  setTotalMonths(e.target.value);
                  handleTotalPriceOrMonths(totalPrice, e.target.value);
                }}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
              ค่างวด/เดือน (บาท)
            </label>
            <input
              type="number"
              min="0"
              inputMode="decimal"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="คำนวณอัตโนมัติ"
              value={monthlyAmount}
              onChange={e => setMonthlyAmount(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
              เริ่มผ่อนเดือน
            </label>
            <div className="flex items-center border border-slate-200 rounded-xl px-4 py-2.5">
              <button onClick={() => setStartMonth(k => advanceMonthKey(k, -1))} className="text-slate-500">
                <ChevronLeft size={16} />
              </button>
              <span className="flex-1 text-center font-medium text-slate-900">
                {formatMonthKeyThai(startMonth)}
              </span>
              <button onClick={() => setStartMonth(k => advanceMonthKey(k, 1))} className="text-slate-500">
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

      <ConfirmDialog
        open={deleteTarget !== null}
        title="ลบรายการผ่อน"
        message={`ต้องการลบ "${deleteTarget?.name ?? ''}" ใช่หรือไม่?`}
        onConfirm={() => {
          if (deleteTarget) ctx.deleteInstallment(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
