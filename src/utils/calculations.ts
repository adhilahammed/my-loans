import type { Lender, Transaction, LenderSummary, OverallSummary, TransactionType } from '../types';
import { formatCurrency } from './currency';

/**
 * Calculates financial totals for a single lender from transaction records.
 * Transactions are the single source of truth.
 */
export function calculateLenderSummary(
  lender: Lender,
  transactions: Transaction[]
): LenderSummary {
  const lenderTxns = transactions.filter((t) => t.lenderId === lender.id);

  let totalBorrowedMinor = 0;
  let totalRepaidMinor = 0;

  for (const t of lenderTxns) {
    if (t.type === 'borrowed') {
      totalBorrowedMinor += t.amountMinor;
    } else if (t.type === 'repaid') {
      totalRepaidMinor += t.amountMinor;
    }
  }

  const outstandingBalanceMinor = Math.max(0, totalBorrowedMinor - totalRepaidMinor);
  const isSettled = totalBorrowedMinor > 0 && outstandingBalanceMinor === 0;

  return {
    lender,
    totalBorrowedMinor,
    totalRepaidMinor,
    outstandingBalanceMinor,
    isSettled,
    transactionCount: lenderTxns.length,
  };
}

/**
 * Calculates overall summary across all lenders.
 */
export function calculateOverallSummary(
  lenders: Lender[],
  transactions: Transaction[]
): OverallSummary {
  let totalOutstandingMinor = 0;
  let totalBorrowedMinor = 0;
  let totalRepaidMinor = 0;
  let settledLenderCount = 0;
  let activeLenderCount = 0;

  for (const lender of lenders) {
    const summary = calculateLenderSummary(lender, transactions);
    totalOutstandingMinor += summary.outstandingBalanceMinor;
    totalBorrowedMinor += summary.totalBorrowedMinor;
    totalRepaidMinor += summary.totalRepaidMinor;

    if (summary.isSettled) {
      settledLenderCount++;
    } else if (summary.outstandingBalanceMinor > 0) {
      activeLenderCount++;
    }
  }

  return {
    totalOutstandingMinor,
    totalBorrowedMinor,
    totalRepaidMinor,
    lenderCount: lenders.length,
    settledLenderCount,
    activeLenderCount,
  };
}

/**
 * Validates adding a new transaction.
 */
export function validateAddTransaction({
  type,
  amountMinor,
  lenderId,
  existingTransactions,
  currencyCode = 'INR',
}: {
  type: TransactionType;
  amountMinor: number;
  lenderId: string;
  existingTransactions: Transaction[];
  currencyCode?: string;
}): { valid: boolean; error?: string } {
  if (amountMinor <= 0) {
    return { valid: false, error: 'Amount must be greater than zero.' };
  }

  if (type === 'repaid') {
    const lenderTxns = existingTransactions.filter((t) => t.lenderId === lenderId);
    let borrowed = 0;
    let repaid = 0;
    for (const t of lenderTxns) {
      if (t.type === 'borrowed') borrowed += t.amountMinor;
      else if (t.type === 'repaid') repaid += t.amountMinor;
    }
    const currentOutstanding = Math.max(0, borrowed - repaid);

    if (currentOutstanding === 0) {
      return {
        valid: false,
        error: 'Cannot record a repayment: there is no outstanding balance for this lender.',
      };
    }

    if (amountMinor > currentOutstanding) {
      return {
        valid: false,
        error: `Repayment amount (${formatCurrency(amountMinor, currencyCode)}) exceeds the outstanding balance (${formatCurrency(currentOutstanding, currencyCode)}).`,
      };
    }
  }

  return { valid: true };
}

/**
 * Validates updating an existing transaction.
 */
export function validateEditTransaction({
  transactionId,
  lenderId,
  newType,
  newAmountMinor,
  existingTransactions,
  currencyCode = 'INR',
}: {
  transactionId: string;
  lenderId: string;
  newType: TransactionType;
  newAmountMinor: number;
  existingTransactions: Transaction[];
  currencyCode?: string;
}): { valid: boolean; error?: string } {
  if (newAmountMinor <= 0) {
    return { valid: false, error: 'Amount must be greater than zero.' };
  }

  // Filter other transactions for this lender excluding the one being edited
  const otherTxns = existingTransactions.filter(
    (t) => t.lenderId === lenderId && t.id !== transactionId
  );

  let borrowedOthers = 0;
  let repaidOthers = 0;
  for (const t of otherTxns) {
    if (t.type === 'borrowed') borrowedOthers += t.amountMinor;
    else if (t.type === 'repaid') repaidOthers += t.amountMinor;
  }

  if (newType === 'borrowed') {
    const newTotalBorrowed = borrowedOthers + newAmountMinor;
    if (newTotalBorrowed < repaidOthers) {
      const minRequired = repaidOthers - borrowedOthers;
      return {
        valid: false,
        error: `Borrowed amount cannot be less than ${formatCurrency(minRequired, currencyCode)} because repayments of ${formatCurrency(repaidOthers, currencyCode)} have already been recorded.`,
      };
    }
  } else if (newType === 'repaid') {
    const maxRepayment = Math.max(0, borrowedOthers - repaidOthers);
    if (newAmountMinor > maxRepayment) {
      return {
        valid: false,
        error: `Repayment amount exceeds the allowable balance of ${formatCurrency(maxRepayment, currencyCode)}.`,
      };
    }
  }

  return { valid: true };
}

/**
 * Validates deleting an existing transaction.
 */
export function validateDeleteTransaction({
  transactionId,
  existingTransactions,
  currencyCode = 'INR',
}: {
  transactionId: string;
  existingTransactions: Transaction[];
  currencyCode?: string;
}): { valid: boolean; error?: string } {
  const target = existingTransactions.find((t) => t.id === transactionId);
  if (!target) {
    return { valid: false, error: 'Transaction not found.' };
  }

  // If deleting a borrowing transaction, make sure repayments don't exceed remaining borrowings
  if (target.type === 'borrowed') {
    const lenderTxns = existingTransactions.filter((t) => t.lenderId === target.lenderId);
    let remainingBorrowed = 0;
    let totalRepaid = 0;

    for (const t of lenderTxns) {
      if (t.id === transactionId) continue;
      if (t.type === 'borrowed') remainingBorrowed += t.amountMinor;
      else if (t.type === 'repaid') totalRepaid += t.amountMinor;
    }

    if (remainingBorrowed < totalRepaid) {
      const deficit = totalRepaid - remainingBorrowed;
      return {
        valid: false,
        error: `Cannot delete this loan. Existing repayments exceed remaining loans by ${formatCurrency(deficit, currencyCode)}. Delete or adjust repayments first.`,
      };
    }
  }

  return { valid: true };
}
