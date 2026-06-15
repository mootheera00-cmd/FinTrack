import { useState, useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, TrendingDown, LayoutDashboard, RefreshCw, ClipboardList, Users } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { useData } from '@/hooks/useData';
import {
  formatCurrency,
  currentMonthKey,
  lastNMonthKeys,
  formatMonthKeyThaiShort,
} from '@/lib/utils';
import type { MonthlySummary } from '@/types';

const BAR_COUNT = 6;
const CHART_H = 160;
const BAR_W = 16;
const GROUP_GAP = 8;

function BarChart({ summaries }: { summaries: MonthlySummary[] }) {
  const months = useMemo(() => {
    const cur = currentMonthKey();
    return lastNMonthKeys(cur, BAR_COUNT).reverse();
  }, []);

  const data = useMemo(() => {
    return months.map(mk => {
      const s = summaries.find(x => x.month_key === mk);
      return {
        mk,
        income: s?.income ?? 0,
        out: s?.total_out ?? 0,
        balance: s?.balance ?? 0,
      };
    });
  }, [months, summaries]);

  const maxVal = useMemo(() => {
    return Math.max(...data.flatMap(d => [d.income, d.out, Math.abs(d.balance)]), 1);
  }, [data]);

  const totalW = BAR_COUNT * (BAR_W * 3 + GROUP_GAP * 2 + 12) + 12;
  const barH = (val: number) => Math.max((Math.abs(val) / maxVal) * CHART_H, 2);

  return (
    <div className="overflow-x-auto pb-1">
      <svg width={totalW} height={CHART_H + 40} className="overflow-visible">
        {data.map((d, gi) => {
          const gx = gi * (BAR_W * 3 + GROUP_GAP * 2 + 12) + 12;
          return (
            <g key={d.mk} transform={`translate(${gx}, 0)`}>
              <rect x={0} y={CHART_H - barH(d.income)} width={BAR_W} height={barH(d.income)} rx={3} fill="#404040" opacity={0.85} />
              <rect x={BAR_W + GROUP_GAP} y={CHART_H - barH(d.out)} width={BAR_W} height={barH(d.out)} rx={3} fill="#a3a3a3" opacity={0.85} />
              <rect x={BAR_W * 2 + GROUP_GAP * 2} y={d.balance >= 0 ? CHART_H - barH(d.balance) : CHART_H} width={BAR_W} height={barH(d.balance)} rx={3} fill={d.balance >= 0 ? '#525252' : '#d4d4d4'} opacity={0.85} />
              <text x={BAR_W * 1.5 + GROUP_GAP} y={CHART_H + 14} textAnchor="middle" fontSize={9} fill="#737373">
                {formatMonthKeyThaiShort(d.mk)}
              </text>
            </g>
          );
        })}
        <line x1={0} y1={CHART_H} x2={totalW} y2={CHART_H} stroke="#e2e8f0" strokeWidth={1} />
      </svg>
    </div>
  );
}

export default function DashboardPage() {
  const ctx = useData();
  const [monthKey, setMonthKey] = useState(currentMonthKey());

  // Find the summary for the selected month
  const summary: MonthlySummary | undefined = useMemo(
    () => ctx.monthlySummaries.find(s => s.month_key === monthKey),
    [ctx.monthlySummaries, monthKey],
  );

  // Get detailed counts for the selected month
  const monthIncomes = ctx.incomes.filter(i => i.month_key === monthKey);
  const monthExpenses = ctx.expenses.filter(e => e.month_key === monthKey);

  // Separate recurring vs one-time expenses
  const recurringExpenses = monthExpenses.filter(e => e.is_recurring);
  const oneTimeExpenses = monthExpenses.filter(e => !e.is_recurring);

  const incomeCount = monthIncomes.length;
  const expenseCount = monthExpenses.length;
  const recurringCount = recurringExpenses.length;
  const oneTimeCount = oneTimeExpenses.length;

  // Active installments covering this month
  const activeInstallments = ctx.installments.filter(inst => {
    const start = inst.start_month;
    const endIdx = inst.total_months - 1;
    const [y, m] = start.split('-').map(Number);
    const endMonth = `${y + Math.floor((m - 1 + endIdx) / 12)}-${String(((m - 1 + endIdx) % 12) + 1).padStart(2, '0')}`;
    return start <= monthKey && monthKey <= endMonth;
  });

  const income = summary?.income ?? 0;
  const installments = summary?.installments ?? 0;
  const shared = summary?.shared ?? 0;
  const totalOut = summary?.total_out ?? 0;
  const balance = summary?.balance ?? 0;

  return (
    <Layout monthKey={monthKey} onMonthChange={setMonthKey}>
      <div className="px-4 pt-6 pb-4 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-neutral-900 flex items-center gap-2"><LayoutDashboard size={20} className="text-neutral-500" /> รายรับ-รายจ่าย</h1>
          <span className="text-xs text-neutral-400 bg-neutral-100 px-3 py-1 rounded-full font-medium">
            {incomeCount + expenseCount + activeInstallments.length} รายการ
          </span>
        </div>

        {/* Balance hero card */}
        <div className="rounded-2xl bg-neutral-900 border border-neutral-700 p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={16} className="text-neutral-400" />
            <p className="text-xs text-neutral-400 font-medium tracking-wide">คงเหลือสุทธิ</p>
          </div>
          <p className={`text-3xl font-bold tabular-nums mt-1 ${balance >= 0 ? 'text-neutral-100' : 'text-neutral-400'}`}>
            {formatCurrency(balance)}
          </p>
          <div className="flex items-center gap-1 mt-1">
            {balance >= 0
              ? <TrendingUp size={14} className="text-neutral-400" />
              : <TrendingUp size={14} className="text-neutral-400 rotate-180" />
            }
            <span className={`text-xs font-medium text-neutral-400/70`}>
              {balance >= 0 ? 'เกินดุล' : 'ขาดดุล'}
            </span>
          </div>
        </div>

        {/* Summary grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="!border-neutral-200 !bg-neutral-50/50">
            <div className="flex items-center gap-1.5 mb-2">
              <ArrowUpRight size={16} className="text-neutral-600" />
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">รายรับ</p>
            </div>
            <p className="text-xl font-bold text-neutral-700 tabular-nums">
              {formatCurrency(income)}
            </p>
            <p className="text-[11px] text-neutral-400 mt-1">{incomeCount} รายการ</p>
          </Card>

          <Card className="!border-neutral-200 !bg-neutral-50/50">
            <div className="flex items-center gap-1.5 mb-2">
              <ArrowDownRight size={16} className="text-neutral-600" />
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">รายจ่าย</p>
            </div>
            <p className="text-xl font-bold text-neutral-700 tabular-nums">
              {formatCurrency(totalOut)}
            </p>
            <p className="text-[11px] text-neutral-400 mt-1">
              {expenseCount + activeInstallments.length} รายการ
            </p>
          </Card>
        </div>

        {/* Breakdown */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider px-1">
            รายละเอียดรายจ่าย
          </p>

          <Card variant="elevated" className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center">
                <span className="text-neutral-500"><TrendingDown size={16} /></span>
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900">รายจ่ายทั่วไป</p>
                <p className="text-[11px] text-neutral-400">{oneTimeCount} รายการ</p>
              </div>
            </div>
            <p className="font-semibold text-neutral-700 tabular-nums text-sm">
              {formatCurrency(oneTimeExpenses.reduce((s, e) => s + e.amount, 0))}
            </p>
          </Card>

          <Card variant="elevated" className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center">
                <span className="text-neutral-500"><RefreshCw size={16} /></span>
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900">รายจ่ายประจำ</p>
                <p className="text-[11px] text-neutral-400">{recurringCount} รายการ</p>
              </div>
            </div>
            <p className="font-semibold text-neutral-700 tabular-nums text-sm">
              {formatCurrency(recurringExpenses.reduce((s, e) => s + e.amount, 0))}
            </p>
          </Card>

          <Card variant="elevated" className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center">
                <span className="text-neutral-500"><ClipboardList size={16} /></span>
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900">ผ่อนชำระ</p>
                <p className="text-[11px] text-neutral-400">{activeInstallments.length} รายการ</p>
              </div>
            </div>
            <p className="font-semibold text-neutral-700 tabular-nums text-sm">
              {formatCurrency(installments)}
            </p>
          </Card>

          <Card variant="elevated" className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center">
                <span className="text-neutral-500"><Users size={16} /></span>
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900">ซื้อร่วม</p>
                <p className="text-[11px] text-neutral-400">{shared > 0 ? 'รวมในรายจ่าย' : 'ไม่มี'}</p>
              </div>
            </div>
            <p className="font-semibold text-neutral-700 tabular-nums text-sm">
              {formatCurrency(shared)}
            </p>
          </Card>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-4 overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">กราฟ 6 เดือนล่าสุด</p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-sm bg-neutral-700" />
                <span className="text-[9px] text-neutral-400">รายรับ</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-sm bg-neutral-400" />
                <span className="text-[9px] text-neutral-400">รายจ่าย</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-sm bg-neutral-900" />
                <span className="text-[9px] text-neutral-400">คงเหลือ</span>
              </div>
            </div>
          </div>
          {ctx.loading ? (
            <div className="h-40 bg-neutral-100 rounded-xl animate-pulse" />
          ) : (
            <BarChart summaries={ctx.monthlySummaries} />
          )}
        </div>

        {/* Income list preview */}
        {monthIncomes.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider px-1">
              รายรับ
            </p>
            {monthIncomes.map(inc => (
              <Card key={inc.id} className="flex items-center justify-between">
                <p className="text-sm font-medium text-neutral-900 truncate">{inc.name}</p>
                <p className="text-sm font-semibold text-neutral-700 tabular-nums shrink-0 ml-3">
                  {formatCurrency(inc.amount)}
                </p>
              </Card>
            ))}
          </div>
        )}

        {/* One-time expense list preview */}
        {oneTimeExpenses.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider px-1">
              รายจ่ายทั่วไป (เดือนนี้)
            </p>
            {oneTimeExpenses.map(exp => (
              <Card key={exp.id} className="flex items-center justify-between">
                <p className="text-sm font-medium text-neutral-900 truncate">{exp.name}</p>
                <p className="text-sm font-semibold text-neutral-700 tabular-nums shrink-0 ml-3">
                  {formatCurrency(exp.amount)}
                </p>
              </Card>
            ))}
          </div>
        )}

        {/* Recurring expense list preview */}
        {recurringExpenses.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider px-1">
              รายจ่ายประจำ
            </p>
            {recurringExpenses.map(exp => (
              <Card key={exp.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded font-medium shrink-0">
                    ประจำ
                  </span>
                  <p className="text-sm font-medium text-neutral-900 truncate">{exp.name}</p>
                </div>
                <p className="text-sm font-semibold text-neutral-700 tabular-nums shrink-0 ml-3">
                  {formatCurrency(exp.amount)}
                </p>
              </Card>
            ))}
          </div>
        )}

        {/* Loading state */}
        {ctx.loading && (
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-neutral-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
