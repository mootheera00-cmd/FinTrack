import { useMemo } from 'react';
import type { ForecastResult, Installment, RecurringExpense } from '@/types';

interface ForecastInput {
  liquidCash: number;
  monthlyIncome: number;
  installments: Installment[];
  recurringExpenses: RecurringExpense[];
}

/**
 * Smart Forecasting Engine
 *
 * Safe to Spend = (Liquid Cash + Expected Income) - (Fixed Expenses + Total Installments Due)
 *
 * "Fixed Expenses" here = sum of actual active recurring expenses.
 */
export function useForecasting({
  liquidCash,
  monthlyIncome,
  installments,
  recurringExpenses,
}: ForecastInput): ForecastResult {
  return useMemo(() => {
    const currentLiquidCash = liquidCash;
    const expectedIncome    = monthlyIncome;

    // Sum of active recurring expenses (e.g. rent, internet, subscriptions)
    const fixedExpenses = recurringExpenses
      .filter((r) => r.is_active)
      .reduce((sum, r) => sum + r.amount, 0);

    // Total installment charges due next cycle (all active, not yet paid-off)
    const totalCardDue = installments
      .filter((i) => i.is_active && i.paid_months < i.total_months)
      .reduce((sum, i) => sum + i.monthly_amount, 0);

    const safeToSpend =
      (currentLiquidCash + expectedIncome) - (fixedExpenses + totalCardDue);

    return {
      currentLiquidCash,
      expectedIncome,
      fixedExpenses,
      totalCardDue,
      safeToSpend,
    };
  }, [liquidCash, monthlyIncome, installments, recurringExpenses]);
}
