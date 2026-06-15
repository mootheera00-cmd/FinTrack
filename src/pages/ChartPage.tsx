import { useMemo, useState } from 'react';
import { Search, ChevronDown, ChevronUp, ArrowUpRight, ArrowDownRight, Download, History, TrendingUp, TrendingDown, Inbox } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { useData } from '@/hooks/useData';
import {
  formatCurrency,
  formatMonthKeyThai,
  compareMonthKeys,
} from '@/lib/utils';

export default function ChartPage() {
  const ctx = useData();
  const [search, setSearch] = useState('');
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  // Group all transactions by month_key
  const monthGroups = useMemo(() => {
    const groups = new Map<string, { income: typeof ctx.incomes; expenses: typeof ctx.expenses }>();

    for (const inc of ctx.incomes) {
      if (!groups.has(inc.month_key)) groups.set(inc.month_key, { income: [], expenses: [] });
      groups.get(inc.month_key)!.income.push(inc);
    }
    for (const exp of ctx.expenses) {
      if (!groups.has(exp.month_key)) groups.set(exp.month_key, { income: [], expenses: [] });
      groups.get(exp.month_key)!.expenses.push(exp);
    }

    // Filter by search
    const q = search.trim().toLowerCase();
    if (q) {
      for (const [mk, g] of groups) {
        const filteredIncome = g.income.filter(i => i.name.toLowerCase().includes(q));
        const filteredExpenses = g.expenses.filter(e => e.name.toLowerCase().includes(q));
        if (filteredIncome.length === 0 && filteredExpenses.length === 0) {
          groups.delete(mk);
        } else {
          groups.set(mk, { income: filteredIncome, expenses: filteredExpenses });
        }
      }
    }

    // Sort months descending
    return Array.from(groups.entries())
      .sort(([a], [b]) => -compareMonthKeys(a, b))
      .map(([mk, g]) => ({
        month_key: mk,
        totalIncome: g.income.reduce((s, i) => s + i.amount, 0),
        totalExpenses: g.expenses.reduce((s, e) => s + e.amount, 0),
        income: g.income,
        expenses: g.expenses,
      }));
  }, [ctx.incomes, ctx.expenses, search]);

  const toggleExpand = (mk: string) => {
    setExpandedMonths(prev => {
      const next = new Set(prev);
      if (next.has(mk)) next.delete(mk);
      else next.add(mk);
      return next;
    });
  };

  // Auto-expand first month
  useMemo(() => {
    if (monthGroups.length > 0 && expandedMonths.size === 0) {
      setExpandedMonths(new Set([monthGroups[0].month_key]));
    }
  }, [monthGroups.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Layout>
      <div className="px-4 pt-6 pb-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-neutral-900 flex items-center gap-2"><History size={20} className="text-neutral-500" /> ประวัติทั้งหมด</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => ctx.exportCSV()}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border active:scale-95 shadow-sm bg-neutral-100 border-neutral-200 text-neutral-700 hover:bg-neutral-200 hover:border-neutral-300"
              title="ส่งออกข้อมูลทั้งหมดเพื่อสำรอง"
            >
              <Download size={12} className="text-neutral-500" />
              <span>ส่งออก CSV</span>
            </button>
            <span className="text-xs text-neutral-400 bg-neutral-100 px-3 py-1 rounded-full font-medium">
              {monthGroups.reduce((s, g) => s + g.income.length + g.expenses.length, 0)} รายการ
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            className="w-full border border-neutral-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 bg-white"
            placeholder="ค้นหารายการ..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Loading */}
        {ctx.loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-neutral-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : monthGroups.length === 0 ? (
          <div className="text-center text-neutral-400 py-16">
            <Inbox size={48} className="text-neutral-300 mx-auto mb-3" />
            <p className="text-sm">{search ? 'ไม่พบรายการที่ค้นหา' : 'ยังไม่มีประวัติรายการ'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {monthGroups.map(group => {
              const isExpanded = expandedMonths.has(group.month_key);
              const balance = group.totalIncome - group.totalExpenses;
              const totalItems = group.income.length + group.expenses.length;

              return (
                <Card key={group.month_key} className="overflow-hidden !p-0">
                  {/* Month header */}
                  <button
                    onClick={() => toggleExpand(group.month_key)}
                    className="w-full flex items-center justify-between px-4 py-3.5 active:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full ${balance >= 0 ? 'bg-neutral-700' : 'bg-neutral-400'}`} />
                      <div className="text-left">
                        <p className="text-sm font-bold text-neutral-900">
                          {formatMonthKeyThai(group.month_key)}
                        </p>
                        <p className="text-[10px] text-neutral-400">{totalItems} รายการ</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs font-semibold text-neutral-700 tabular-nums">
                          {formatCurrency(group.totalIncome)}
                        </p>
                        <p className="text-xs font-semibold text-neutral-500 tabular-nums">
                          {formatCurrency(group.totalExpenses)}
                        </p>
                      </div>
                      {isExpanded ? <ChevronUp size={16} className="text-neutral-400" /> : <ChevronDown size={16} className="text-neutral-400" />}
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-neutral-100 px-4 py-3 space-y-3">
                      {/* Mini summary */}
                      <div className="flex items-center justify-between bg-neutral-50 rounded-xl px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center bg-neutral-200`}>
                            {balance >= 0
                              ? <ArrowUpRight size={12} className="text-neutral-700" />
                              : <ArrowDownRight size={12} className="text-neutral-500" />
                            }
                          </div>
                          <span className="text-xs text-neutral-500">คงเหลือ</span>
                        </div>
                        <span className={`text-sm font-bold tabular-nums ${balance >= 0 ? 'text-neutral-700' : 'text-neutral-500'}`}>
                          {formatCurrency(balance)}
                        </span>
                      </div>

                      {/* Income items */}
                      {group.income.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold text-neutral-700 uppercase tracking-wider mb-1.5 flex items-center gap-1"><TrendingUp size={12} /> รายรับ</p>
                          <div className="space-y-1">
                            {group.income.map(inc => (
                              <div key={inc.id} className="flex items-center justify-between py-1">
                                <p className="text-sm text-neutral-900 truncate">{inc.name}</p>
                                <p className="text-sm font-semibold text-neutral-700 tabular-nums shrink-0 ml-3">
                                  {formatCurrency(inc.amount)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Expense items */}
                      {group.expenses.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5 flex items-center gap-1"><TrendingDown size={12} /> รายจ่าย</p>
                          <div className="space-y-1">
                            {group.expenses.map(exp => (
                              <div key={exp.id} className="flex items-center justify-between py-1">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {exp.is_recurring && (
                                    <span className="text-[8px] text-neutral-500 bg-neutral-100 px-1 py-0.5 rounded font-medium shrink-0">ประจำ</span>
                                  )}
                                  <p className="text-sm text-neutral-900 truncate">{exp.name}</p>
                                </div>
                                <p className="text-sm font-semibold text-neutral-500 tabular-nums shrink-0 ml-3">
                                  {formatCurrency(exp.amount)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
