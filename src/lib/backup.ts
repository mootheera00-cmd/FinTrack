/**
 * Backup & Restore utilities.
 * Exports / imports all user data as a single JSON file for safe-keeping.
 */

import type { Income, Expense, Installment, SharedExpense } from '@/types';

export interface BackupData {
  version:   1;
  exportedAt: string;
  incomes:        Income[];
  expenses:       Expense[];
  installments:   Installment[];
  sharedExpenses: SharedExpense[];
}

/* ─── Export all data as a downloadable JSON file ─────────── */
export function downloadBackup(data: {
  incomes:        Income[];
  expenses:       Expense[];
  installments:   Installment[];
  sharedExpenses: SharedExpense[];
}): void {
  const backup: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    ...data,
  };

  const json  = JSON.stringify(backup, null, 2);
  const blob  = new Blob([json], { type: 'application/json' });
  const url   = URL.createObjectURL(blob);
  const a     = document.createElement('a');
  a.href      = url;
  a.download  = `fintrack-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ─── Parse a backup file and return the data ─────────────── */
export function parseBackupFile(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as BackupData;
        if (!data.version || !Array.isArray(data.incomes)) {
          reject(new Error('ไฟล์สำรองข้อมูลไม่ถูกต้อง'));
          return;
        }
        resolve(data);
      } catch {
        reject(new Error('ไม่สามารถอ่านไฟล์สำรองข้อมูลได้'));
      }
    };
    reader.onerror = () => reject(new Error('เกิดข้อผิดพลาดในการอ่านไฟล์'));
    reader.readAsText(file);
  });
}
