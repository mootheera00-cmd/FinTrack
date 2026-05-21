import { useContext, useMemo } from 'react';
import { DataContext } from '@/context/DataContext';

export function useInstallments(cardId?: string) {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useInstallments must be used within a DataProvider');
  }

  // Filter installments in memory if cardId is provided
  const installments = useMemo(() => {
    if (cardId) {
      return context.installments.filter((i) => i.credit_card_id === cardId);
    }
    return context.installments;
  }, [context.installments, cardId]);

  /** Total monthly amount across all active installments */
  const totalMonthlyDue = useMemo(() => {
    return installments.reduce((sum, i) => sum + i.monthly_amount, 0);
  }, [installments]);

  return {
    installments,
    loading: context.loading.installments,
    error: context.error.installments,
    totalMonthlyDue,
    refetch: context.refetchInstallments,
    create: context.createInstallment,
    markPaid: context.markInstallmentPaid,
    remove: context.deleteInstallment,
  };
}
