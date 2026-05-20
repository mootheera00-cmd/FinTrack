import { useState } from 'react';
import { Plus, Search, ArrowUpRight, ArrowDownRight, Trash2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useTransactions } from '@/hooks/useTransactions';
import { useProfile } from '@/hooks/useProfile';
import { formatCurrency, formatDate } from '@/lib/utils';
import { AddTransactionModal } from '@/components/modals/AddTransactionModal';
import type { TransactionType } from '@/types';

const CATEGORY_EMOJI: Record<string, string> = {
  salary: '💼', freelance: '💻', investment: '📈', other_income: '💰',
  food: '🍜', transport: '🚗', shopping: '🛍️', entertainment: '🎬',
  utilities: '💡', health: '🏥', education: '📚', travel: '✈️', other_expense: '📦',
};

export default function Transactions() {
  const { profile } = useProfile();
  const currency = profile?.currency ?? 'THB';
  const { transactions, totalIncome, totalExpenses, loading, remove } = useTransactions();

  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter]   = useState<'all' | TransactionType>('all');
  const [query, setQuery]     = useState('');

  const filtered = transactions.filter((t) => {
    const matchType  = filter === 'all' || t.type === filter;
    const matchQuery = !query || (t.note ?? t.category).toLowerCase().includes(query.toLowerCase());
    return matchType && matchQuery;
  });

  return (
    <Layout>
      <Header
        title="Transactions"
        right={
          <Button size="sm" icon={<Plus size={16} />} onClick={() => setShowAdd(true)}>
            Add
          </Button>
        }
      />

      <div className="p-4 space-y-4">
        {/* Summary Row */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="flex items-center gap-3">
            <span className="p-2 bg-green-50 rounded-xl"><ArrowUpRight size={18} className="text-green-700" /></span>
            <div>
              <p className="text-[11px] text-slate-500 uppercase tracking-wide">Income</p>
              <p className="font-bold text-brand-400 tabular-nums">{formatCurrency(totalIncome, currency)}</p>
            </div>
          </Card>
          <Card className="flex items-center gap-3">
            <span className="p-2 bg-rose-50 rounded-xl"><ArrowDownRight size={18} className="text-rose-600" /></span>
            <div>
              <p className="text-[11px] text-slate-500 uppercase tracking-wide">Expenses</p>
              <p className="font-bold text-rose-600 tabular-nums">{formatCurrency(totalExpenses, currency)}</p>
            </div>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search transactions…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl pl-9 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {(['all', 'income', 'expense'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl capitalize transition-colors ${
                filter === f
                  ? 'bg-brand-500 text-white'
                  : 'bg-white text-slate-500 border border-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-slate-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="text-center py-10">
            <p className="text-slate-500">No transactions found</p>
          </Card>
        ) : (
          <Card className="divide-y divide-slate-200 p-0 overflow-hidden">
            {filtered.map((txn) => (
              <div key={txn.id} className="flex items-center gap-3 px-4 py-3 group">
                <span className="text-xl w-8 text-center shrink-0">
                  {CATEGORY_EMOJI[txn.category] ?? '💳'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {txn.note ?? txn.category.replace('_', ' ')}
                  </p>
                  <p className="text-xs text-slate-500">{formatDate(txn.txn_date)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-sm font-bold tabular-nums ${
                      txn.type === 'income' ? 'text-brand-400' : 'text-rose-600'
                    }`}
                  >
                    {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount, currency)}
                  </span>
                  <button
                    onClick={() => void remove(txn.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                    aria-label="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </Card>
        )}
      </div>

      <AddTransactionModal open={showAdd} onClose={() => setShowAdd(false)} />
    </Layout>
  );
}
