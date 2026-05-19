// ─── Currency formatting ──────────────────────────────────────

/**
 * Format a number as Thai Baht (or any supported currency).
 * Examples: formatCurrency(1234567.5, 'THB') => "฿1,234,567.50"
 */
export function formatCurrency(amount: number, currency = 'THB'): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Compact format for large numbers on cards, e.g. 1234567 => "฿1.23M"
 */
export function formatCurrencyCompact(amount: number, currency = 'THB'): string {
  const symbol = currency === 'THB' ? '฿' : currency;
  if (Math.abs(amount) >= 1_000_000)
    return `${symbol}${(amount / 1_000_000).toFixed(2)}M`;
  if (Math.abs(amount) >= 1_000)
    return `${symbol}${(amount / 1_000).toFixed(1)}K`;
  return `${symbol}${amount.toFixed(2)}`;
}

// ─── Date helpers ─────────────────────────────────────────────

export function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function todayISO(): string {
  return toISODate(new Date());
}

/** Returns the first day of the current month as ISO string */
export function startOfMonthISO(): string {
  const d = new Date();
  return toISODate(new Date(d.getFullYear(), d.getMonth(), 1));
}

/** Returns the last day of the current month as ISO string */
export function endOfMonthISO(): string {
  const d = new Date();
  return toISODate(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

/**
 * Given a statement day (day of month), determine whether the upcoming
 * billing cycle falls in the current month or next month.
 * Returns the next statement date as a Date.
 */
export function nextStatementDate(statementDay: number): Date {
  const today = new Date();
  const thisMonthStatement = new Date(today.getFullYear(), today.getMonth(), statementDay);
  if (today <= thisMonthStatement) return thisMonthStatement;
  return new Date(today.getFullYear(), today.getMonth() + 1, statementDay);
}

/** Human-readable relative date label */
export function relativeDate(isoDate: string): string {
  const date = new Date(isoDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const diff = Math.round((date.getTime() - today.getTime()) / 86_400_000);
  if (diff === 0)  return 'Today';
  if (diff === 1)  return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 0)    return `In ${diff} days`;
  return `${Math.abs(diff)} days ago`;
}

/** Format date as "Mon 19 May" */
export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

// ─── Misc ─────────────────────────────────────────────────────

export function clsx(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
