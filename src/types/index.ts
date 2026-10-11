export type LenderType = 'person' | 'bank' | 'other';

export type TransactionType = 'borrowed' | 'repaid';

export interface Lender {
  id: string;
  name: string;
  type: LenderType;
  notes?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface Transaction {
  id: string;
  lenderId: string;
  type: TransactionType;
  amountMinor: number; // Stored in integer minor units (paise/cents: 1 unit = 100 minor units)
  date: string; // YYYY-MM-DD
  description?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface LenderSummary {
  lender: Lender;
  totalBorrowedMinor: number;
  totalRepaidMinor: number;
  outstandingBalanceMinor: number;
  isSettled: boolean;
  transactionCount: number;
}

export interface OverallSummary {
  totalOutstandingMinor: number;
  totalBorrowedMinor: number;
  totalRepaidMinor: number;
  lenderCount: number;
  settledLenderCount: number;
  activeLenderCount: number;
}

export interface AppSettings {
  currency: string; // 'INR', 'USD', 'EUR', 'GBP', etc.
}

export type ActiveTab = 'loans' | 'history' | 'settings';

export type Route =
  | { view: 'loans' }
  | { view: 'lender-detail'; lenderId: string }
  | { view: 'add-lender' }
  | { view: 'edit-lender'; lenderId: string }
  | { view: 'add-transaction'; lenderId?: string; defaultType?: TransactionType }
  | { view: 'edit-transaction'; transactionId: string }
  | { view: 'history' }
  | { view: 'settings' };
