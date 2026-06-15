/**
 * LocalStorage cache layer for instant data loading (Preload).
 * Data is cached after each successful Supabase fetch so the next
 * app open renders immediately without waiting for network.
 */

import type { Income, Expense, Installment, SharedExpense, Profile } from '@/types';

/* ─── Cache Keys ──────────────────────────────────────────── */
const CACHE_PREFIX = 'fintrack_cache_';
const KEYS = {
  profile:        `${CACHE_PREFIX}profile`,
  incomes:        `${CACHE_PREFIX}incomes`,
  expenses:       `${CACHE_PREFIX}expenses`,
  installments:   `${CACHE_PREFIX}installments`,
  sharedExpenses: `${CACHE_PREFIX}shared`,
  timestamp:      `${CACHE_PREFIX}ts`,
} as const;

interface CacheData {
  profile:        Profile | null;
  incomes:        Income[];
  expenses:       Expense[];
  installments:   Installment[];
  sharedExpenses: SharedExpense[];
}

/* ─── Save all data to cache ──────────────────────────────── */
export function saveAllToCache(data: CacheData): void {
  try {
    localStorage.setItem(KEYS.profile,        JSON.stringify(data.profile));
    localStorage.setItem(KEYS.incomes,        JSON.stringify(data.incomes));
    localStorage.setItem(KEYS.expenses,       JSON.stringify(data.expenses));
    localStorage.setItem(KEYS.installments,   JSON.stringify(data.installments));
    localStorage.setItem(KEYS.sharedExpenses, JSON.stringify(data.sharedExpenses));
    localStorage.setItem(KEYS.timestamp,      Date.now().toString());
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

/* ─── Load all data from cache ────────────────────────────── */
export function loadAllFromCache(): { data: CacheData; age: number } | null {
  try {
    const profile        = localStorage.getItem(KEYS.profile);
    const incomes        = localStorage.getItem(KEYS.incomes);
    const expenses       = localStorage.getItem(KEYS.expenses);
    const installments   = localStorage.getItem(KEYS.installments);
    const sharedExpenses = localStorage.getItem(KEYS.sharedExpenses);
    const ts             = localStorage.getItem(KEYS.timestamp);

    if (!incomes || !expenses || !installments || !sharedExpenses) return null;

    const now    = Date.now();
    const cached = parseInt(ts ?? '0', 10);
    const age    = now - cached; // age in ms

    return {
      data: {
        profile:        profile ? JSON.parse(profile) : null,
        incomes:        JSON.parse(incomes),
        expenses:       JSON.parse(expenses),
        installments:   JSON.parse(installments),
        sharedExpenses: JSON.parse(sharedExpenses),
      },
      age,
    };
  } catch {
    return null;
  }
}

/* ─── Clear entire cache ──────────────────────────────────── */
export function clearCache(): void {
  Object.values(KEYS).forEach(k => {
    try { localStorage.removeItem(k); } catch { /* noop */ }
  });
}

/* ─── Get age string for UI ───────────────────────────────── */
export function getCacheAgeString(): string {
  const ts = localStorage.getItem(KEYS.timestamp);
  if (!ts) return 'ไม่มี';

  const diff = Date.now() - parseInt(ts, 10);
  const sec  = Math.floor(diff / 1000);
  const min  = Math.floor(sec / 60);
  const hr   = Math.floor(min / 60);

  if (hr > 0)   return `${hr} ชม. ที่แล้ว`;
  if (min > 0)  return `${min} นาที ที่แล้ว`;
  return `เมื่อสักครู่`;
}

/* ─── Check if cache exists ───────────────────────────────── */
export function hasCache(): boolean {
  return localStorage.getItem(KEYS.timestamp) !== null;
}
