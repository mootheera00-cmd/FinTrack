import { useState } from 'react';
import { Plus, Trash2, CheckCircle2, Calendar, AlertTriangle } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useRecurringExpenses } from '@/hooks/useRecurringExpenses';
import { useProfile } from '@/hooks/useProfile';
import { AddRecurringModal } from '@/components/modals/AddRecurringModal';
import { formatCurrency } from '@/lib/utils';

const CATEGORY_EMOJI: Record<string, string> = {
  food: '🍜', transport: '🚗', shopping: '🛍️', entertainment: '🎬',
  utilities: '💡', health: '🏥', education: '📚', travel: '✈️', other_expense: '📦',
};

export default function Recurring() {
  const { profile } = useProfile();
  const currency = profile?.currency ?? 'THB';

  const {
    recurringExpenses,
    loading,
    needDbMigration,
    totalMonthlyRecurring,
    remove,
    markAsPaid,
    isPaidThisMonth,
  } = useRecurringExpenses();

  const [modalOpen, setModalOpen] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const paidExpenses = recurringExpenses.filter((r) => isPaidThisMonth(r.description));
  const unpaidExpenses = recurringExpenses.filter((r) => !isPaidThisMonth(r.description));

  const totalPaidAmount = paidExpenses.reduce((sum, r) => sum + r.amount, 0);
  const totalUnpaidAmount = unpaidExpenses.reduce((sum, r) => sum + r.amount, 0);

  const progressPercentage = recurringExpenses.length > 0 
    ? Math.round((paidExpenses.length / recurringExpenses.length) * 100) 
    : 0;

  async function handleMarkPaid(description: string, amount: number, category: string, id: string) {
    setMarkingId(id);
    try {
      await markAsPaid(description, amount, category);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึกรายการ');
    } finally {
      setMarkingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (confirm('คุณต้องการลบรายจ่ายประจำนี้ใช่หรือไม่?')) {
      try {
        await remove(id);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการลบ');
      }
    }
  }

  return (
    <Layout>
      <Header
        title="Recurring"
        subtitle="รายจ่ายประจำ"
        right={
          !needDbMigration && (
            <button
              onClick={() => setModalOpen(true)}
              className="p-2 rounded-xl bg-brand-400/10 text-brand-500 hover:bg-brand-400/20 transition-all duration-200 active:scale-95 flex items-center justify-center"
              aria-label="Add Recurring Expense"
            >
              <Plus size={20} strokeWidth={2.5} />
            </button>
          )
        }
      />

      <div className="p-4 space-y-4 pb-24">
        {/* Migration Alert */}
        {needDbMigration && (
          <Card className="border-amber-200 bg-amber-50/50 text-amber-900 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
              <div>
                <p className="font-semibold text-sm">ต้องรัน Database Migration</p>
                <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                  ตาราง <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono text-[10px]">recurring_expenses</code> ยังไม่ได้สร้างในระบบฐานข้อมูลของคุณ
                </p>
              </div>
            </div>
            <div className="text-xs bg-white/80 p-2.5 rounded-xl border border-amber-100 font-mono text-[10px] overflow-x-auto whitespace-pre">
{`-- กรุณาคัดลอก SQL นี้ไปรันใน Supabase SQL Editor:
create table if not exists public.recurring_expenses (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  description   text not null,
  amount        numeric(12, 2) not null check (amount > 0),
  category      transaction_category not null default 'other_expense',
  due_day       smallint not null check (due_day between 1 and 31),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.recurring_expenses enable row level security;

create policy "recurring_expenses: owner access" on public.recurring_expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);`}
            </div>
          </Card>
        )}

        {/* Progress Card */}
        {!needDbMigration && recurringExpenses.length > 0 && (
          <Card className="relative overflow-hidden bg-white">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">ชำระแล้วในเดือนนี้</p>
                <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                  {formatCurrency(totalPaidAmount, currency)}
                  <span className="text-xs font-normal text-slate-500 ml-1.5">
                    จากทั้งหมด {formatCurrency(totalMonthlyRecurring, currency)}
                  </span>
                </p>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-brand-500 bg-brand-50 rounded-full px-2.5 py-1">
                  {progressPercentage}%
                </span>
                <span className="text-[10px] text-slate-400 mt-1">
                  {paidExpenses.length}/{recurringExpenses.length} รายการ
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-brand-500 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            {unpaidExpenses.length > 0 && (
              <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
                📅 ยังเหลือยอดต้องชำระอีก{' '}
                <span className="font-semibold text-rose-500 tabular-nums">
                  {formatCurrency(totalUnpaidAmount, currency)}
                </span>
              </p>
            )}
          </Card>
        )}

        {/* Empty State */}
        {!needDbMigration && recurringExpenses.length === 0 && !loading && (
          <Card className="text-center py-12 flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center">
              <Calendar className="text-brand-400" size={28} />
            </div>
            <div className="space-y-1.5">
              <p className="font-bold text-slate-800">ไม่มีรายการรายจ่ายประจำ</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto px-4">
                เพิ่มค่าบริการรายเดือน สัญญารายปี หรือรายจ่ายที่ต้องจ่ายแน่นอนทุกๆ เดือน เช่น Netflix, ค่าหอพัก หรือค่าเน็ต
              </p>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="px-5 py-2.5 bg-brand-500 text-slate-900 rounded-xl font-semibold text-sm active:scale-95 transition-all shadow-sm"
            >
              เพิ่มรายจ่ายประจำแรก
            </button>
          </Card>
        )}

        {/* Loading skeleton */}
        {loading && recurringExpenses.length === 0 && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-slate-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {/* List of Recurring Expenses */}
        {!needDbMigration && recurringExpenses.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">รายการรายจ่ายประจำ</h3>
            {recurringExpenses.map((expense) => {
              const paid = isPaidThisMonth(expense.description);
              const isMarking = markingId === expense.id;

              return (
                <div
                  key={expense.id}
                  className={`flex items-center gap-3 p-4 rounded-2xl bg-white border transition-all duration-300 ${
                    paid 
                      ? 'border-emerald-100 bg-emerald-50/10 opacity-75' 
                      : 'border-slate-200'
                  }`}
                >
                  {/* Category icon */}
                  <span className="text-2xl w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    {CATEGORY_EMOJI[expense.category] ?? '📦'}
                  </span>

                  {/* Info details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={`text-sm font-semibold truncate ${paid ? 'text-slate-600 line-through' : 'text-slate-900'}`}>
                        {expense.description}
                      </p>
                      {paid && <Badge variant="income">ชำระแล้ว</Badge>}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      ทุกวันที่ {expense.due_day} ของเดือน
                    </p>
                  </div>

                  {/* Actions / Amount */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900 tabular-nums">
                        {formatCurrency(expense.amount, currency)}
                      </p>
                    </div>

                    {/* Pay checkbox */}
                    <button
                      onClick={() => !paid && void handleMarkPaid(expense.description, expense.amount, expense.category, expense.id)}
                      disabled={paid || isMarking}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-200 active:scale-90 ${
                        paid
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'bg-white border-slate-300 hover:border-slate-400 text-slate-400'
                      }`}
                      aria-label="Mark as Paid"
                    >
                      {isMarking ? (
                        <span className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                      ) : paid ? (
                        <CheckCircle2 size={18} strokeWidth={2.5} />
                      ) : (
                        <CheckCircle2 size={18} strokeWidth={1.8} />
                      )}
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => void handleDelete(expense.id)}
                      className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 active:scale-90 transition-all flex items-center justify-center"
                      aria-label="Delete recurring expense"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AddRecurringModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </Layout>
  );
}
