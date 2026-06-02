// ─── Thai date helpers ────────────────────────────────────────

const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.',
  'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.',
  'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

/** Returns current month key as "YYYY-MM" */
export function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Format a YYYY-MM month key to Thai, e.g. "มกราคม 2568" */
export function formatMonthKeyThai(monthKey: string, short = false): string {
  const [year, month] = monthKey.split('-').map(Number);
  const months = short ? THAI_MONTHS_SHORT : THAI_MONTHS_FULL;
  return `${months[month - 1]} ${year + 543}`;
}

/** Format a YYYY-MM month key to short Thai, e.g. "ม.ค. 68" */
export function formatMonthKeyThaiShort(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  return `${THAI_MONTHS_SHORT[month - 1]} ${String(year + 543).slice(-2)}`;
}

/** Advance a YYYY-MM month key by n months (negative = go back) */
export function advanceMonthKey(monthKey: string, n: number): string {
  const [year, month] = monthKey.split('-').map(Number);
  const d = new Date(year, month - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Compare two month keys; returns negative/0/positive */
export function compareMonthKeys(a: string, b: string): number {
  return a.localeCompare(b);
}

/** Get last N months including the given month key (descending) */
export function lastNMonthKeys(fromKey: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => advanceMonthKey(fromKey, -i));
}

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
