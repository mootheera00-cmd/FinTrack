import { useContext, useMemo } from 'react';
import { DataContext } from '@/context/DataContext';

export function useTransactions() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useTransactions must be used within a DataProvider');
  }

  // Derived: totals for the current period
  const totalIncome = useMemo(() => {
    return context.transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [context.transactions]);

  const totalExpenses = useMemo(() => {
    return context.transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [context.transactions]);

  return {
    transactions: context.transactions,
    loading: context.loading.transactions,
    error: context.error.transactions,
    totalIncome,
    totalExpenses,
    refetch: context.refetchTransactions,
    create: context.createTransaction,
    remove: context.deleteTransaction,
  };
}
