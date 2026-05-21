import { useContext, useCallback } from 'react';
import { DataContext } from '@/context/DataContext';
import { todayISO } from '@/lib/utils';
import type { RecurringExpenseInput } from '@/types';

export function useRecurringExpenses() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useRecurringExpenses must be used within a DataProvider');
  }

  const create = useCallback(async (input: RecurringExpenseInput) => {
    return await context.createRecurringExpense(input);
  }, [context]);

  const remove = useCallback(async (id: string) => {
    await context.deleteRecurringExpense(id);
  }, [context]);

  /**
   * Log an actual transaction for this recurring expense for the current month.
   */
  const markAsPaid = useCallback(async (description: string, amount: number, category: any) => {
    return await context.createTransaction({
      type: 'expense',
      category,
      amount,
      note: `รายจ่ายประจำ: ${description}`,
      txn_date: todayISO(),
    });
  }, [context]);

  /**
   * Checks if this recurring expense has already been logged as a transaction this month.
   */
  const isPaidThisMonth = useCallback((description: string) => {
    return context.transactions.some(
      (t) => t.type === 'expense' && t.note === `รายจ่ายประจำ: ${description}`
    );
  }, [context.transactions]);

  // Derived: Total monthly recurring expenses
  const totalMonthlyRecurring = context.recurringExpenses.reduce((sum, r) => sum + r.amount, 0);

  return {
    recurringExpenses: context.recurringExpenses,
    loading: context.loading.recurring,
    error: context.error.recurring,
    needDbMigration: context.needDbMigration,
    totalMonthlyRecurring,
    create,
    remove,
    markAsPaid,
    isPaidThisMonth,
    refetch: context.refetchRecurring,
  };
}
