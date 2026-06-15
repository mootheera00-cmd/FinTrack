import { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Trash2, Pencil, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
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

export default function ExpensesPage() {
  const ctx = useData();
  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [modalMonth, setModalMonth] = useState(currentMonthKey());
  const [saving, setSaving] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [editTarget, setEditTarget] = useState<typeof ctx.expenses[0] | null>(null);

  // Auto-carry recurring expenses to months that have no data yet
  const autoCarriedMonths = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (ctx.loading) return;
    if (autoCarriedMonths.current.has(monthKey)) return;

    const currentMonthExpenses = ctx.expenses.filter(e => e.month_key === monthKey);
    if (currentMonthExpenses.length > 0) {
      autoCarriedMonths.current.add(monthKey);
      return;
    }

    const prevMonth = advanceMonthKey(monthKey, -1);
    const recurringFromPrev = ctx.expenses.filter(e => e.month_key === prevMonth && e.is_recurring);
    if (recurringFromPrev.length === 0) return;

    autoCarriedMonths.current.add(monthKey);
    void Promise.all(
      recurringFromPrev.map(exp =>
        ctx.createExpense({
          name: exp.name,
          amount: exp.amount,
          month_key: monthKey,
          is_recurring: true,
        })
      )
    );
  }, [monthKey, ctx.expenses, ctx.loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Autocomplete: unique expense names from history
  const allNames = useMemo(() => {
    return Array.from(new Set(ctx.expenses.map(e => e.name))).sort();
  }, [ctx.expenses]);

  const filteredSuggestions = useMemo(() => {
    if (!name.trim()) return [];
    return allNames.filter(n => n.toLowerCase().includes(name.toLowerCase()));
  }, [name, allNames]);

  const monthExpenses = ctx.expenses.filter(e => e.month_key === monthKey);
  const recurringMonthExpenses = monthExpenses.filter(e => e.is_recurring);
  const oneTimeExpenses = monthExpenses.filter(e => !e.is_recurring);
  const total = monthExpenses.reduce((s, e) => s + e.amount, 0);

  const openModal = (exp?: typeof ctx.expenses[0]) => {
    if (exp) {
      setEditTarget(exp);
      setName(exp.name);
      setAmount(String(exp.amount));
      setIsRecurring(exp.is_recurring);
      setModalMonth(exp.month_key);
    } else {
      setEditTarget(null);
      setName('');
      setAmount('');
      setIsRecurring(false);
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
        await ctx.updateExpense({ id: editTarget.id, name: name.trim(), amount: amt, month_key: modalMonth, is_recurring: isRecurring });
      } else {
        await ctx.createExpense({
          name: name.trim(),
          amount: amt,
          month_key: modalMonth,
          is_recurring: isRecurring,
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
          <h1 className="text-xl font-bold text-slate-900">💸 รายจ่าย</h1>
          <button
            onClick={() => openModal()}
            className="w-10 h-10 rounded-full bg-brand-400 flex items-center justify-center shadow-md active:scale-95"
          >
            <Plus size={20} className="text-slate-900" />
          </button>
        </div>

        {/* Total card */}
        <div className="rounded-2xl bg-gradient-to-r from-rose-50 to-red-50 border border-rose-200 p-4 mb-4">
          <p className="text-xs text-slate-500 mb-1">รายจ่ายรวม</p>
          <p className="text-2xl font-bold text-rose-600 tabular-nums">{formatCurrency(total)}</p>
          <p className="text-xs text-slate-400 mt-1">{monthExpenses.length} รายการ</p>
        </div>

        {/* Expense list */}
        {ctx.loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : monthExpenses.length === 0 ? (
          <div className="text-center text-slate-400 py-16">
            <p className="text-4xl mb-3">💸</p>
            <p>ยังไม่มีรายจ่ายในเดือนนี้</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Recurring expenses section */}
            {recurringMonthExpenses.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider flex items-center gap-1">
                    <RefreshCw size={11} /> รายจ่ายประจำ
                  </p>
                  <p className="text-xs font-semibold text-amber-600 tabular-nums">
                    {formatCurrency(recurringMonthExpenses.reduce((s, e) => s + e.amount, 0))}
                  </p>
                </div>
                <div className="space-y-2">
                  {recurringMonthExpenses.map(exp => (
                    <Card key={exp.id} className="flex items-center gap-3 border-amber-100 bg-amber-50/40">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{exp.name}</p>
                      </div>
                      <p className="font-bold text-rose-600 tabular-nums shrink-0">
                        {formatCurrency(exp.amount)}
                      </p>
                      <button
                        onClick={() => ctx.toggleExpenseRecurring(exp.id, false)}
                        className="shrink-0 text-amber-500 hover:text-slate-400 transition-colors"
                        title="ยกเลิกรายจ่ายประจำ"
                      >
                        <RefreshCw size={14} />
                      </button>
                      <button
                        onClick={() => openModal(exp)}
                        className="shrink-0 text-slate-300 hover:text-blue-500 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                      onClick={() => setDeleteTarget({ id: exp.id, name: exp.name })}
                        className="shrink-0 text-slate-300 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* One-time expenses section */}
            {oneTimeExpenses.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    รายจ่ายเดือนนี้
                  </p>
                  <p className="text-xs font-semibold text-slate-500 tabular-nums">
                    {formatCurrency(oneTimeExpenses.reduce((s, e) => s + e.amount, 0))}
                  </p>
                </div>
                <div className="space-y-2">
                  {oneTimeExpenses.map(exp => (
                    <Card key={exp.id} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{exp.name}</p>
                      </div>
                      <p className="font-bold text-rose-600 tabular-nums shrink-0">
                        {formatCurrency(exp.amount)}
                      </p>
                      <button
                        onClick={() => ctx.toggleExpenseRecurring(exp.id, true)}
                        className="shrink-0 text-slate-300 hover:text-amber-400 transition-colors"
                        title="ทำเครื่องหมายรายจ่ายประจำ"
                      >
                        <RefreshCw size={14} />
                      </button>
                      <button
                        onClick={() => openModal(exp)}
                        className="shrink-0 text-slate-300 hover:text-blue-500 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: exp.id, name: exp.name })}
                        className="shrink-0 text-slate-300 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editTarget ? 'แก้ไขรายจ่าย' : 'เพิ่มรายจ่าย'}>
        <div className="p-5 space-y-4">
          <div className="relative">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
              ชื่อรายจ่าย
            </label>
            <input
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="เช่น ค่าอาหาร, ค่าไฟ"
              value={name}
              onChange={e => {
                setName(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              autoComplete="off"
            />
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                {filteredSuggestions.slice(0, 5).map(s => (
                  <button
                    key={s}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-900 hover:bg-slate-50 border-b border-slate-100 last:border-0"
                    onMouseDown={() => { setName(s); setShowSuggestions(false); }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
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
            onClick={() => setIsRecurring(v => !v)}
            className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-colors ${
              isRecurring
                ? 'bg-amber-50 border-amber-300 text-amber-700'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
          >
            <RefreshCw size={16} />
            <span className="text-sm font-medium">
              {isRecurring ? 'รายจ่ายประจำ 🔄 (เปิด)' : 'ทำเครื่องหมายรายจ่ายประจำ 🔄'}
            </span>
          </button>

          <Button fullWidth loading={saving} onClick={handleSave}>
            บันทึก
          </Button>
        </div>
      </Modal>
      </Layout>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="ลบรายจ่าย"
        message={`ต้องการลบ "${deleteTarget?.name ?? ''}" ใช่หรือไม่?`}
        onConfirm={() => {
          if (deleteTarget) ctx.deleteExpense(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
