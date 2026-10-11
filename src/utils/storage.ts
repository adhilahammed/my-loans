import type { Lender, Transaction, AppSettings } from '../types';
import { DEFAULT_CURRENCY } from './currency';

const STORAGE_KEYS = {
  LENDERS: 'my_loans_v1_lenders',
  TRANSACTIONS: 'my_loans_v1_transactions',
  SETTINGS: 'my_loans_v1_settings',
} as const;

export const DEFAULT_SETTINGS: AppSettings = {
  currency: DEFAULT_CURRENCY,
};

// Check if localStorage is usable
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export function loadLenders(): Lender[] {
  if (!isLocalStorageAvailable()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.LENDERS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Sanitize items
    return parsed.filter(
      (item): item is Lender =>
        Boolean(item && typeof item.id === 'string' && typeof item.name === 'string')
    );
  } catch (err) {
    console.error('Failed to load lenders from storage:', err);
    return [];
  }
}

export function saveLenders(lenders: Lender[]): boolean {
  if (!isLocalStorageAvailable()) return false;
  try {
    window.localStorage.setItem(STORAGE_KEYS.LENDERS, JSON.stringify(lenders));
    return true;
  } catch (err) {
    console.error('Failed to save lenders to storage:', err);
    return false;
  }
}

export function loadTransactions(): Transaction[] {
  if (!isLocalStorageAvailable()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is Transaction =>
        Boolean(
          item &&
          typeof item.id === 'string' &&
          typeof item.lenderId === 'string' &&
          (item.type === 'borrowed' || item.type === 'repaid') &&
          typeof item.amountMinor === 'number'
        )
    );
  } catch (err) {
    console.error('Failed to load transactions from storage:', err);
    return [];
  }
}

export function saveTransactions(transactions: Transaction[]): boolean {
  if (!isLocalStorageAvailable()) return false;
  try {
    window.localStorage.setItem(
      STORAGE_KEYS.TRANSACTIONS,
      JSON.stringify(transactions)
    );
    return true;
  } catch (err) {
    console.error('Failed to save transactions to storage:', err);
    return false;
  }
}

export function loadSettings(): AppSettings {
  if (!isLocalStorageAvailable()) return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.currency === 'string') {
      return { currency: parsed.currency };
    }
    return DEFAULT_SETTINGS;
  } catch (err) {
    console.error('Failed to load settings from storage:', err);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): boolean {
  if (!isLocalStorageAvailable()) return false;
  try {
    window.localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    return true;
  } catch (err) {
    console.error('Failed to save settings to storage:', err);
    return false;
  }
}

export function clearAllData(): boolean {
  if (!isLocalStorageAvailable()) return false;
  try {
    window.localStorage.removeItem(STORAGE_KEYS.LENDERS);
    window.localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    window.localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    return true;
  } catch (err) {
    console.error('Failed to clear storage:', err);
    return false;
  }
}

export interface BackupPayload {
  version: string;
  exportedAt: string;
  app: string;
  lenders: Lender[];
  transactions: Transaction[];
  settings: AppSettings;
}

export function exportData(): string {
  const payload: BackupPayload = {
    version: '1.0',
    app: 'my-loans',
    exportedAt: new Date().toISOString(),
    lenders: loadLenders(),
    transactions: loadTransactions(),
    settings: loadSettings(),
  };
  return JSON.stringify(payload, null, 2);
}

export function importData(jsonString: string): {
  success: boolean;
  error?: string;
  lendersCount?: number;
  transactionsCount?: number;
} {
  try {
    const data = JSON.parse(jsonString);
    if (!data || typeof data !== 'object') {
      return { success: false, error: 'Invalid backup file format.' };
    }
    if (!Array.isArray(data.lenders) || !Array.isArray(data.transactions)) {
      return {
        success: false,
        error: 'Backup file is missing lenders or transactions list.',
      };
    }

    const lenders: Lender[] = data.lenders.filter(
      (l: any) => l && typeof l.id === 'string' && typeof l.name === 'string'
    );
    const transactions: Transaction[] = data.transactions.filter(
      (t: any) =>
        t &&
        typeof t.id === 'string' &&
        typeof t.lenderId === 'string' &&
        (t.type === 'borrowed' || t.type === 'repaid') &&
        typeof t.amountMinor === 'number'
    );

    saveLenders(lenders);
    saveTransactions(transactions);

    if (data.settings && typeof data.settings.currency === 'string') {
      saveSettings({ currency: data.settings.currency });
    }

    return {
      success: true,
      lendersCount: lenders.length,
      transactionsCount: transactions.length,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to parse JSON file.' };
  }
}
