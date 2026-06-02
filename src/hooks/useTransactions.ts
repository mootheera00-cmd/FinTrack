// Legacy hook — use useData() from @/hooks/useData for new code.
export function useTransactions() {
  return { transactions: [], loading: false, error: null, totalIncome: 0, totalExpenses: 0 };
}

