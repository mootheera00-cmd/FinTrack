import { useMemo } from 'react';
import type { ForecastResult, Installment, Transaction } from '@/types';

interface ForecastInput {
  liquidCash: number;
  monthlyIncome: number;
  transactions: Transaction[];
  installments: Installment[];
}

/**
 * Smart Forecasting Engine
 *
 * Safe to Spend = (Liquid Cash + Expected Income) - (Fixed Expenses + Total Installments Due)
 *
 * "Fixed Expenses" here = sum of recurring expense transactions this month
 * (a proxy until a dedicated fixed-expense table is added).
 */
export function useForecasting({
  liquidCash,
  monthlyIncome,
  transactions,
  installments,
}: ForecastInput): ForecastResult {
  return useMemo(() => {
    const currentLiquidCash = liquidCash;
    const expectedIncome    = monthlyIncome;

    // Sum of expense transactions in the current month as fixed cost proxy
    const fixedExpenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

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
  }, [liquidCash, monthlyIncome, transactions, installments]);
}
