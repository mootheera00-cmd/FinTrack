import { useMemo } from 'react';
import Layout from '@/components/layout/Layout';
import { useData } from '@/hooks/useData';
import {
  formatCurrency,
  currentMonthKey,
  lastNMonthKeys,
  formatMonthKeyThaiShort,
} from '@/lib/utils';

const BAR_COUNT = 6;
const CHART_H = 180;
const BAR_W = 18;
const GROUP_GAP = 10;

function BarChart({ summaries }: { summaries: ReturnType<typeof useData>['monthlySummaries'] }) {
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
    return Math.max(
      ...data.flatMap(d => [d.income, d.out, Math.abs(d.balance)]),
      1,
    );
  }, [data]);

  const totalW = BAR_COUNT * (BAR_W * 3 + GROUP_GAP * 2 + 16) + 16;

  const barH = (val: number) => Math.max((Math.abs(val) / maxVal) * CHART_H, 2);

  return (
    <div className="overflow-x-auto pb-2">
      <svg width={totalW} height={CHART_H + 48} className="overflow-visible">
        {data.map((d, gi) => {
          const gx = gi * (BAR_W * 3 + GROUP_GAP * 2 + 16) + 16;
          return (
            <g key={d.mk} transform={`translate(${gx}, 0)`}>
              {/* Income bar */}
              <rect
                x={0}
                y={CHART_H - barH(d.income)}
                width={BAR_W}
                height={barH(d.income)}
                rx={4}
                fill="#10b981"
                opacity={0.85}
              />
              {/* Expenses bar */}
              <rect
                x={BAR_W + GROUP_GAP}
                y={CHART_H - barH(d.out)}
                width={BAR_W}
                height={barH(d.out)}
                rx={4}
                fill="#f43f5e"
                opacity={0.85}
              />
              {/* Balance bar */}
              <rect
                x={BAR_W * 2 + GROUP_GAP * 2}
                y={d.balance >= 0 ? CHART_H - barH(d.balance) : CHART_H}
                width={BAR_W}
                height={barH(d.balance)}
                rx={4}
                fill={d.balance >= 0 ? '#FFBF00' : '#94a3b8'}
                opacity={0.85}
              />
              {/* Month label */}
              <text
                x={BAR_W * 1.5 + GROUP_GAP}
                y={CHART_H + 16}
                textAnchor="middle"
                fontSize={10}
                fill="#64748b"
              >
                {formatMonthKeyThaiShort(d.mk)}
              </text>
            </g>
          );
        })}
        {/* Baseline */}
        <line x1={0} y1={CHART_H} x2={totalW} y2={CHART_H} stroke="#e2e8f0" strokeWidth={1} />
      </svg>
    </div>
  );
}

export default function ChartPage() {
  const ctx = useData();
  const cur = currentMonthKey();
  const currentSummary = ctx.monthlySummaries.find(s => s.month_key === cur);

  return (
    <Layout>
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-xl font-bold text-slate-900 mb-4">📊 กราฟรายรับ-รายจ่าย</h1>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-emerald-500" />
            <span className="text-xs text-slate-500">รายรับ</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-rose-500" />
            <span className="text-xs text-slate-500">รายจ่าย (รวมผ่อน+ซื้อร่วม)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-brand-400" />
            <span className="text-xs text-slate-500">คงเหลือ</span>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-4 overflow-hidden">
          {ctx.loading ? (
            <div className="h-48 bg-slate-100 rounded-xl animate-pulse" />
          ) : (
            <BarChart summaries={ctx.monthlySummaries} />
          )}
        </div>

        {/* Current month summary */}
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          สรุปเดือนนี้
        </p>
        <div className="space-y-2">
          {[
            { label: '💰 รายรับ', value: currentSummary?.income ?? 0, color: 'text-emerald-600' },
            { label: '💸 รายจ่ายทั่วไป', value: currentSummary?.expenses ?? 0, color: 'text-rose-600' },
            { label: '📋 ค่างวดรวม', value: currentSummary?.installments ?? 0, color: 'text-blue-600' },
            { label: '🤝 ซื้อร่วม (ที่รวม)', value: currentSummary?.shared ?? 0, color: 'text-purple-600' },
            { label: '📤 รายจ่ายรวมทั้งหมด', value: currentSummary?.total_out ?? 0, color: 'text-rose-700' },
          ].map(row => (
            <div
              key={row.label}
              className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-slate-100"
            >
              <span className="text-sm text-slate-600">{row.label}</span>
              <span className={`font-bold tabular-nums ${row.color}`}>
                {formatCurrency(row.value)}
              </span>
            </div>
          ))}

          <div
            className={`flex items-center justify-between rounded-xl px-4 py-3 border ${
              (currentSummary?.balance ?? 0) >= 0
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-rose-50 border-rose-200'
            }`}
          >
            <span className="font-semibold text-slate-700">✨ คงเหลือ</span>
            <span
              className={`text-lg font-bold tabular-nums ${
                (currentSummary?.balance ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {formatCurrency(currentSummary?.balance ?? 0)}
            </span>
          </div>
        </div>
      </div>
    </Layout>
  );
}
