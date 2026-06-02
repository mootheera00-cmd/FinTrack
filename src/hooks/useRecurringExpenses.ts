// Legacy hook
export function useRecurringExpenses() {
  return { recurringExpenses: [], loading: false, error: null, needDbMigration: false };
}

