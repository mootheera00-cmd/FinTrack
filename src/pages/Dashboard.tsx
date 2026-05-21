import { useState, useContext } from 'react';
import {
  TrendingDown,
  CreditCard,
  Sparkles,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  BarChart3,
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import Header from '@/components/layout/Header';
import { Card, StatCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useTransactions } from '@/hooks/useTransactions';
import { useInstallments } from '@/hooks/useInstallments';
import { useForecasting } from '@/hooks/useForecasting';
import { useProfile } from '@/hooks/useProfile';
import { useRecurringExpenses } from '@/hooks/useRecurringExpenses';
import { DataContext } from '@/context/DataContext';
import { formatCurrency, formatDate } from '@/lib/utils';

// ─── Hero Balance Card ────────────────────────────────────────
interface HeroCardProps {
  liquidCash: number;
  currency: string;
  loading: boolean;
}

function HeroCard({ liquidCash, currency, loading }: HeroCardProps) {
  return (
    <div
      className="relative overflow-hidden rounded-3xl mx-4 p-6"
      style={{ background: 'linear-gradient(135deg, #FFBF00 0%, #f59e0b 60%, #d97706 100%)' }}
    >
      {/* Decorative blobs */}
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-8 -left-8  w-32 h-32 rounded-full bg-white/10 blur-xl" />

      <p className="text-sm font-medium text-slate-800/80 mb-1">Current Liquid Cash</p>

      {loading ? (
        <div className="h-10 w-48 bg-slate-900/10 rounded-xl animate-pulse" />
      ) : (
        <p className="text-4xl font-bold text-slate-900 tracking-tight tabular-nums">
          {formatCurrency(liquidCash, currency)}
        </p>
      )}

      <div className="flex items-center gap-2 mt-4">
        <span className="flex items-center gap-1 text-xs text-slate-800 bg-slate-900/10 rounded-full px-3 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-700 animate-pulse" />
          Live Balance
        </span>
      </div>
    </div>
  );
}

// ─── Forecast Breakdown Card ──────────────────────────────────
interface ForecastCardProps {
  safeToSpend: number;
  expectedIncome: number;
  fixedExpenses: number;
  totalCardDue: number;
  currency: string;
  loading: boolean;
}

function ForecastCard({
  safeToSpend,
  expectedIncome,
  fixedExpenses,
  totalCardDue,
  currency,
  loading,
}: ForecastCardProps) {
  const isPositive = safeToSpend >= 0;

  return (
    <Card className="mx-4 animate-fade-up" style={{ animationDelay: '100ms' } as React.CSSProperties}>
      <div className="flex items-center gap-2 mb-4">
        <span className="p-2 rounded-xl bg-amber-500/15">
          <Sparkles size={18} className="text-amber-400" />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-900">Next Month Forecast</p>
          <p className="text-xs text-slate-500">Safe to Spend Projection</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-5 bg-slate-200 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="space-y-2 mb-4 text-sm">
            <ForecastRow
              label="Expected Income"
              value={formatCurrency(expectedIncome, currency)}
              positive
            />
            <ForecastRow
              label="Fixed / Recurring Expenses"
              value={`–${formatCurrency(fixedExpenses, currency)}`}
            />
            <ForecastRow
              label="Credit Card Installments"
              value={`–${formatCurrency(totalCardDue, currency)}`}
            />
          </div>

          <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Safe to Spend</span>
            <span
              className={`text-lg font-bold tabular-nums ${
                isPositive ? 'text-brand-400' : 'text-rose-600'
              }`}
            >
              {formatCurrency(safeToSpend, currency)}
            </span>
          </div>
        </>
      )}
    </Card>
  );
}

function ForecastRow({ label, value, positive = false }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={positive ? 'text-brand-400 font-medium' : 'text-slate-700 font-medium'}>
        {value}
      </span>
    </div>
  );
}

// ─── Monthly Summary History Card ─────────────────────────────
const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

function formatThaiMonth(dateStr: string) {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const month = date.getMonth();
  const yearShort = (date.getFullYear() + 543) % 100;
  return `${THAI_MONTHS_SHORT[month]} ${yearShort}`;
}

interface MonthlySummaryProps {
  summary: { month: string; income: number; expense: number; remaining: number }[];
  currency: string;
  loading: boolean;
}

function MonthlySummaryCard({ summary, currency, loading }: MonthlySummaryProps) {
  const last6Months = summary.slice(-6);

  // Find max value for scaling the height of the chart bars
  const maxVal = Math.max(
    ...last6Months.flatMap((s) => [s.income, s.expense]),
    1 // fallback to avoid division by zero
  );

  return (
    <Card className="mx-4 animate-fade-up" style={{ animationDelay: '150ms' } as React.CSSProperties}>
      <div className="flex items-center gap-2 mb-4">
        <span className="p-2 rounded-xl bg-emerald-500/15">
          <BarChart3 size={18} className="text-emerald-500" />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-900">Monthly Savings Summary</p>
          <p className="text-xs text-slate-500">สรุปยอดคงเหลือรายเดือน</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
          <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
        </div>
      ) : last6Months.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-slate-400 text-xs">ไม่มีข้อมูลประวัติรายเดือน</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Chart Bars */}
          <div className="flex items-end justify-between h-28 pt-2 px-1 border-b border-slate-100">
            {last6Months.map((m) => {
              const incPercent = (m.income / maxVal) * 100;
              const expPercent = (m.expense / maxVal) * 100;

              return (
                <div key={m.month} className="flex flex-col items-center flex-1">
                  <div className="flex items-end gap-1 h-20 w-full justify-center">
                    {/* Income Bar (Green) */}
                    <div
                      style={{ height: `${Math.max(incPercent, 4)}%` }}
                      className="w-2.5 rounded-t-full bg-gradient-to-t from-emerald-500 to-emerald-400 transition-all duration-500"
                      title={`รายรับ: ${formatCurrency(m.income, currency)}`}
                    />
                    {/* Expense Bar (Red) */}
                    <div
                      style={{ height: `${Math.max(expPercent, 4)}%` }}
                      className="w-2.5 rounded-t-full bg-gradient-to-t from-rose-500 to-rose-400 transition-all duration-500"
                      title={`รายจ่าย: ${formatCurrency(m.expense, currency)}`}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 mt-2 tracking-tight">
                    {formatThaiMonth(m.month)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Quick List Details */}
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {last6Months.slice().reverse().map((m) => {
              const isSavingsPositive = m.remaining >= 0;
              const savingsRate = m.income > 0 ? Math.round((m.remaining / m.income) * 100) : 0;

              return (
                <div key={m.month} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0 text-xs">
                  <span className="font-semibold text-slate-700">{formatThaiMonth(m.month)}</span>
                  <div className="text-right flex items-center gap-2">
                    <span className="text-slate-400">
                      ดุล:{' '}
                      <span className={isSavingsPositive ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
                        {formatCurrency(m.remaining, currency)}
                      </span>
                    </span>
                    {m.income > 0 && isSavingsPositive && (
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full">
                        +{savingsRate}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── Recent Transactions List ─────────────────────────────────
interface RecentTransactionsProps {
  transactions: ReturnType<typeof useTransactions>['transactions'];
  currency: string;
}

const CATEGORY_EMOJI: Record<string, string> = {
  salary: '💼', freelance: '💻', investment: '📈', other_income: '💰',
  food: '🍜', transport: '🚗', shopping: '🛍️', entertainment: '🎬',
  utilities: '💡', health: '🏥', education: '📚', travel: '✈️', other_expense: '📦',
};

function RecentTransactions({ transactions, currency }: RecentTransactionsProps) {
  const recent = transactions.slice(0, 5);

  return (
    <div className="mx-4 pb-20">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-700">Recent Transactions</h2>
        <button className="text-xs text-brand-400 flex items-center gap-0.5 font-medium">
          See all <ChevronRight size={14} />
        </button>
      </div>

      {recent.length === 0 ? (
        <Card className="text-center py-8">
          <p className="text-slate-500 text-sm">No transactions this month</p>
        </Card>
      ) : (
        <Card className="divide-y divide-slate-200 p-0 overflow-hidden">
          {recent.map((txn) => (
            <div key={txn.id} className="flex items-center gap-3 px-4 py-3">
              <span className="text-xl w-8 text-center shrink-0">
                {CATEGORY_EMOJI[txn.category] ?? '💳'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {txn.note ?? txn.category.replace('_', ' ')}
                </p>
                <p className="text-xs text-slate-500">{formatDate(txn.txn_date)}</p>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <span
                  className={`text-sm font-semibold tabular-nums flex items-center gap-0.5 ${
                    txn.type === 'income' ? 'text-brand-400' : 'text-rose-600'
                  }`}
                >
                  {txn.type === 'income' ? (
                    <ArrowUpRight size={14} />
                  ) : (
                    <ArrowDownRight size={14} />
                  )}
                  {formatCurrency(txn.amount, currency)}
                </span>
                <Badge variant={txn.type === 'income' ? 'income' : 'expense'}>
                  {txn.type}
                </Badge>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────
export default function Dashboard() {
  const { profile, loading: profileLoading } = useProfile();
  const currency = profile?.currency ?? 'THB';

  const { monthlySummary, loading: { summary: summaryLoading } } = useContext(DataContext)!;

  const {
    transactions,
    totalExpenses,
    loading: txnLoading,
    refetch: refetchTxns,
  } = useTransactions();

  const {
    installments,
    totalMonthlyDue,
    loading: installLoading,
  } = useInstallments();

  const {
    recurringExpenses,
    loading: recurringLoading,
  } = useRecurringExpenses();

  const forecast = useForecasting({
    liquidCash:    profile?.liquid_cash    ?? 0,
    monthlyIncome: profile?.monthly_income ?? 0,
    installments,
    recurringExpenses,
  });

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchTxns();
    setRefreshing(false);
  };

  const isLoading = profileLoading || txnLoading || installLoading || recurringLoading;

  const now = new Date();
  const monthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <Layout>
      <Header
        title="FinTrack"
        subtitle={monthLabel}
        right={
          <button
            onClick={() => void handleRefresh()}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors active:scale-95"
            aria-label="Refresh"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>
        }
      />

      <div className="space-y-4 pt-4 pb-4">
        {/* Hero: Liquid Cash */}
        <HeroCard
          liquidCash={profile?.liquid_cash ?? 0}
          currency={currency}
          loading={isLoading}
        />

        {/* Stat Row: Expenses + Card Due */}
        <div className="grid grid-cols-2 gap-3 mx-4">
          <StatCard
            label="This Month"
            value={isLoading ? '–' : formatCurrency(totalExpenses, currency)}
            sub="Total Expenses"
            icon={<TrendingDown size={16} />}
            accent="red"
            animate
          />
          <StatCard
            label="Card Due"
            value={isLoading ? '–' : formatCurrency(totalMonthlyDue, currency)}
            sub={`${installments.filter(i => i.is_active).length} installments`}
            icon={<CreditCard size={16} />}
            accent="blue"
            animate
          />
        </div>

        {/* Forecast breakdown */}
        <ForecastCard
          safeToSpend={forecast.safeToSpend}
          expectedIncome={forecast.expectedIncome}
          fixedExpenses={forecast.fixedExpenses}
          totalCardDue={forecast.totalCardDue}
          currency={currency}
          loading={isLoading}
        />

        {/* Monthly Summary History Card */}
        <MonthlySummaryCard
          summary={monthlySummary}
          currency={currency}
          loading={summaryLoading}
        />

        {/* Recent transactions */}
        <RecentTransactions transactions={transactions} currency={currency} />
      </div>
    </Layout>
  );
}
