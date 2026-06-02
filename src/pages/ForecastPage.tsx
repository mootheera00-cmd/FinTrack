import { useState, useMemo } from 'react';
import Layout from '@/components/layout/Layout';
import { useData } from '@/hooks/useData';
import { formatCurrency, currentMonthKey, advanceMonthKey, formatMonthKeyThai } from '@/lib/utils';

export default function ForecastPage() {
  const ctx = useData();
  const [expectedIncome, setExpectedIncome] = useState('');

  const nextMonth = advanceMonthKey(currentMonthKey(), 1);

  // Recurring expenses (is_recurring = true from this month)
  const recurringExpenses = useMemo(() => {
    return ctx.expenses.filter(e => e.is_recurring);
  }, [ctx.expenses]);

  // Unique recurring expenses (latest occurrence per name)
  const uniqueRecurring = useMemo(() => {
    const map = new Map<string, number>();
    recurringExpenses.forEach(e => {
      const existing = map.get(e.name);
      if (!existing || e.month_key > (recurringExpenses.find(x => x.name === e.name && x.amount === existing)?.month_key ?? '')) {
        map.set(e.name, e.amount);
      }
    });
    return Array.from(map.entries()).map(([name, amount]) => ({ name, amount }));
  }, [recurringExpenses]);

  const totalRecurring = useMemo(() =>
    uniqueRecurring.reduce((s, e) => s + e.amount, 0),
    [uniqueRecurring]
  );

  // Installments active in next month
  const nextMonthInstallments = useMemo(() => {
    return ctx.installments.filter(inst => {
      if (inst.paid_months >= inst.total_months) return false;
      const endMonth = advanceMonthKey(inst.start_month, inst.total_months - 1);
      return inst.start_month <= nextMonth && nextMonth <= endMonth;
    });
  }, [ctx.installments, nextMonth]);

  const totalInstallments = useMemo(() =>
    nextMonthInstallments.reduce((s, i) => s + i.monthly_amount, 0),
    [nextMonthInstallments]
  );

  // Shared expenses for next month that include_in_expenses
  const nextMonthShared = useMemo(() => {
    return ctx.sharedExpenses.filter(
      s => s.month_key === nextMonth && s.include_in_expenses
    );
  }, [ctx.sharedExpenses, nextMonth]);

  const totalShared = useMemo(() =>
    nextMonthShared.reduce((s, se) => s + se.my_share, 0),
    [nextMonthShared]
  );

  const totalOut = totalRecurring + totalInstallments + totalShared;
  const income = parseFloat(expectedIncome) || 0;
  const expectedBalance = income - totalOut;

  return (
    <Layout>
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-xl font-bold text-slate-900 mb-1">🔮 พยากรณ์เดือนหน้า</h1>
        <p className="text-sm text-slate-400 mb-4">{formatMonthKeyThai(nextMonth)}</p>

        {/* Expected income input */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-4">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
            💰 รายรับที่คาดว่าจะได้ (บาท)
          </label>
          <input
            type="number"
            min="0"
            inputMode="decimal"
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xl font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-400"
            placeholder="0.00"
            value={expectedIncome}
            onChange={e => setExpectedIncome(e.target.value)}
          />
        </div>

        {/* Breakdown */}
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          ค่าใช้จ่ายที่คาดการณ์
        </p>

        {/* Recurring expenses */}
        {uniqueRecurring.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-3 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-amber-50">
              <p className="text-sm font-semibold text-amber-700">🔄 รายจ่ายประจำ</p>
            </div>
            {uniqueRecurring.map(e => (
              <div key={e.name} className="flex justify-between px-4 py-2.5 border-b border-slate-50 last:border-0">
                <span className="text-sm text-slate-700">{e.name}</span>
                <span className="text-sm font-semibold text-slate-900 tabular-nums">
                  {formatCurrency(e.amount)}
                </span>
              </div>
            ))}
            <div className="flex justify-between px-4 py-2.5 bg-slate-50">
              <span className="text-sm font-semibold text-slate-700">รวม</span>
              <span className="text-sm font-bold text-amber-700 tabular-nums">
                {formatCurrency(totalRecurring)}
              </span>
            </div>
          </div>
        )}

        {/* Installments */}
        {nextMonthInstallments.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-3 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-blue-50">
              <p className="text-sm font-semibold text-blue-700">📋 ค่างวดที่ถึงกำหนด</p>
            </div>
            {nextMonthInstallments.map(inst => (
              <div key={inst.id} className="flex justify-between px-4 py-2.5 border-b border-slate-50 last:border-0">
                <span className="text-sm text-slate-700">{inst.description}</span>
                <span className="text-sm font-semibold text-slate-900 tabular-nums">
                  {formatCurrency(inst.monthly_amount)}
                </span>
              </div>
            ))}
            <div className="flex justify-between px-4 py-2.5 bg-slate-50">
              <span className="text-sm font-semibold text-slate-700">รวม</span>
              <span className="text-sm font-bold text-blue-700 tabular-nums">
                {formatCurrency(totalInstallments)}
              </span>
            </div>
          </div>
        )}

        {/* Shared */}
        {nextMonthShared.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-3 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-purple-50">
              <p className="text-sm font-semibold text-purple-700">🤝 ซื้อร่วม (รวมรายจ่าย)</p>
            </div>
            {nextMonthShared.map(se => (
              <div key={se.id} className="flex justify-between px-4 py-2.5 border-b border-slate-50 last:border-0">
                <span className="text-sm text-slate-700">{se.description}</span>
                <span className="text-sm font-semibold text-slate-900 tabular-nums">
                  {formatCurrency(se.my_share)}
                </span>
              </div>
            ))}
            <div className="flex justify-between px-4 py-2.5 bg-slate-50">
              <span className="text-sm font-semibold text-slate-700">รวม</span>
              <span className="text-sm font-bold text-purple-700 tabular-nums">
                {formatCurrency(totalShared)}
              </span>
            </div>
          </div>
        )}

        {/* No outgoing items */}
        {uniqueRecurring.length === 0 && nextMonthInstallments.length === 0 && nextMonthShared.length === 0 && (
          <div className="text-center text-slate-400 py-6 bg-white rounded-2xl border border-slate-200 mb-3">
            <p>ยังไม่มีค่าใช้จ่ายที่คาดการณ์ได้</p>
            <p className="text-xs mt-1">เพิ่มรายจ่ายประจำ, ผ่อนชำระ, หรือซื้อร่วมเดือนหน้า</p>
          </div>
        )}

        {/* Result */}
        <div className={`rounded-2xl p-5 border ${
          expectedBalance >= 0
            ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200'
            : 'bg-gradient-to-r from-rose-50 to-red-50 border-rose-200'
        }`}>
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-slate-600">รายรับที่คาดการณ์</span>
            <span className="font-bold text-emerald-600 tabular-nums">
              {formatCurrency(income)}
            </span>
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-slate-600">รายจ่ายที่คาดการณ์</span>
            <span className="font-bold text-rose-600 tabular-nums">
              -{formatCurrency(totalOut)}
            </span>
          </div>
          <div className="border-t border-slate-200 pt-3">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-900">✨ ยอดคงเหลือที่คาดการณ์</span>
              <span className={`text-xl font-bold tabular-nums ${
                expectedBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {formatCurrency(expectedBalance)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
