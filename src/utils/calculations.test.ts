import { describe, it, expect } from 'vitest';
import type { Lender, Transaction } from '../types';
import {
  calculateLenderSummary,
  calculateOverallSummary,
  validateAddTransaction,
  validateEditTransaction,
  validateDeleteTransaction,
} from './calculations';
import { toMinorUnits, fromMinorUnits } from './currency';

describe('Financial Calculations & Transaction Rules', () => {
  const personLender: Lender = {
    id: 'lender-1',
    name: 'Rahul Sharma',
    type: 'person',
    createdAt: '2026-10-11T10:00:00Z',
    updatedAt: '2026-10-11T10:00:00Z',
  };

  const bankLender: Lender = {
    id: 'lender-2',
    name: 'HDFC Bank',
    type: 'bank',
    createdAt: '2026-10-11T10:00:00Z',
    updatedAt: '2026-10-11T10:00:00Z',
  };

  it('converts between major currency units and integer minor units with high precision', () => {
    expect(toMinorUnits(50000)).toBe(5000000);
    expect(fromMinorUnits(5000000)).toBe(50000);
    expect(toMinorUnits(1234.56)).toBe(123456);
    expect(fromMinorUnits(123456)).toBe(1234.56);
  });

  it('calculates initial zero balance for a new lender', () => {
    const summary = calculateLenderSummary(personLender, []);
    expect(summary.totalBorrowedMinor).toBe(0);
    expect(summary.totalRepaidMinor).toBe(0);
    expect(summary.outstandingBalanceMinor).toBe(0);
    expect(summary.isSettled).toBe(false);
  });

  it('borrows ₹50,000 and verifies balance is ₹50,000', () => {
    const tx1: Transaction = {
      id: 'tx-1',
      lenderId: personLender.id,
      type: 'borrowed',
      amountMinor: toMinorUnits(50000),
      date: '2026-10-11',
      createdAt: '2026-10-11T10:05:00Z',
      updatedAt: '2026-10-11T10:05:00Z',
    };

    const summary = calculateLenderSummary(personLender, [tx1]);
    expect(fromMinorUnits(summary.totalBorrowedMinor)).toBe(50000);
    expect(fromMinorUnits(summary.totalRepaidMinor)).toBe(0);
    expect(fromMinorUnits(summary.outstandingBalanceMinor)).toBe(50000);
    expect(summary.isSettled).toBe(false);
  });

  it('repays ₹10,000 and verifies balance is ₹40,000', () => {
    const tx1: Transaction = {
      id: 'tx-1',
      lenderId: personLender.id,
      type: 'borrowed',
      amountMinor: toMinorUnits(50000),
      date: '2026-10-11',
      createdAt: '2026-10-11T10:05:00Z',
      updatedAt: '2026-10-11T10:05:00Z',
    };
    const tx2: Transaction = {
      id: 'tx-2',
      lenderId: personLender.id,
      type: 'repaid',
      amountMinor: toMinorUnits(10000),
      date: '2026-10-11',
      createdAt: '2026-10-11T10:10:00Z',
      updatedAt: '2026-10-11T10:10:00Z',
    };

    const summary = calculateLenderSummary(personLender, [tx1, tx2]);
    expect(fromMinorUnits(summary.totalBorrowedMinor)).toBe(50000);
    expect(fromMinorUnits(summary.totalRepaidMinor)).toBe(10000);
    expect(fromMinorUnits(summary.outstandingBalanceMinor)).toBe(40000);
    expect(summary.isSettled).toBe(false);
  });

  it('borrows another ₹15,000 and verifies balance is ₹55,000', () => {
    const tx1: Transaction = {
      id: 'tx-1',
      lenderId: personLender.id,
      type: 'borrowed',
      amountMinor: toMinorUnits(50000),
      date: '2026-10-11',
      createdAt: '2026-10-11T10:05:00Z',
      updatedAt: '2026-10-11T10:05:00Z',
    };
    const tx2: Transaction = {
      id: 'tx-2',
      lenderId: personLender.id,
      type: 'repaid',
      amountMinor: toMinorUnits(10000),
      date: '2026-10-11',
      createdAt: '2026-10-11T10:10:00Z',
      updatedAt: '2026-10-11T10:10:00Z',
    };
    const tx3: Transaction = {
      id: 'tx-3',
      lenderId: personLender.id,
      type: 'borrowed',
      amountMinor: toMinorUnits(15000),
      date: '2026-10-11',
      createdAt: '2026-10-11T10:15:00Z',
      updatedAt: '2026-10-11T10:15:00Z',
    };

    const summary = calculateLenderSummary(personLender, [tx1, tx2, tx3]);
    expect(fromMinorUnits(summary.totalBorrowedMinor)).toBe(65000);
    expect(fromMinorUnits(summary.totalRepaidMinor)).toBe(10000);
    expect(fromMinorUnits(summary.outstandingBalanceMinor)).toBe(55000);
  });

  it('verifies total balances across multiple lenders', () => {
    const txPerson1: Transaction = {
      id: 'tx-1',
      lenderId: personLender.id,
      type: 'borrowed',
      amountMinor: toMinorUnits(55000),
      date: '2026-10-11',
      createdAt: '2026-10-11T10:00:00Z',
      updatedAt: '2026-10-11T10:00:00Z',
    };
    const txBank1: Transaction = {
      id: 'tx-bank-1',
      lenderId: bankLender.id,
      type: 'borrowed',
      amountMinor: toMinorUnits(100000),
      date: '2026-10-11',
      createdAt: '2026-10-11T10:00:00Z',
      updatedAt: '2026-10-11T10:00:00Z',
    };
    const txBank2: Transaction = {
      id: 'tx-bank-2',
      lenderId: bankLender.id,
      type: 'repaid',
      amountMinor: toMinorUnits(20000),
      date: '2026-10-11',
      createdAt: '2026-10-11T10:00:00Z',
      updatedAt: '2026-10-11T10:00:00Z',
    };

    const overall = calculateOverallSummary(
      [personLender, bankLender],
      [txPerson1, txBank1, txBank2]
    );

    expect(fromMinorUnits(overall.totalBorrowedMinor)).toBe(155000);
    expect(fromMinorUnits(overall.totalRepaidMinor)).toBe(20000);
    expect(fromMinorUnits(overall.totalOutstandingMinor)).toBe(135000);
    expect(overall.lenderCount).toBe(2);
    expect(overall.activeLenderCount).toBe(2);
  });

  it('marks lender as Settled when balance reaches zero after full repayment', () => {
    const tx1: Transaction = {
      id: 'tx-1',
      lenderId: personLender.id,
      type: 'borrowed',
      amountMinor: toMinorUnits(5000),
      date: '2026-10-11',
      createdAt: '2026-10-11T10:00:00Z',
      updatedAt: '2026-10-11T10:00:00Z',
    };
    const tx2: Transaction = {
      id: 'tx-2',
      lenderId: personLender.id,
      type: 'repaid',
      amountMinor: toMinorUnits(5000),
      date: '2026-10-11',
      createdAt: '2026-10-11T10:00:00Z',
      updatedAt: '2026-10-11T10:00:00Z',
    };

    const summary = calculateLenderSummary(personLender, [tx1, tx2]);
    expect(summary.outstandingBalanceMinor).toBe(0);
    expect(summary.isSettled).toBe(true);
  });

  it('rejects invalid amounts and excessive repayments during add', () => {
    const existing = [
      {
        id: 'tx-1',
        lenderId: personLender.id,
        type: 'borrowed' as const,
        amountMinor: toMinorUnits(20000),
        date: '2026-10-11',
        createdAt: '2026-10-11T10:00:00Z',
        updatedAt: '2026-10-11T10:00:00Z',
      },
    ];

    // Zero or negative amount
    const resZero = validateAddTransaction({
      lenderId: personLender.id,
      type: 'borrowed',
      amountMinor: 0,
      existingTransactions: existing,
    });
    expect(resZero.valid).toBe(false);

    // Excessive repayment (> 20,000)
    const resExcess = validateAddTransaction({
      lenderId: personLender.id,
      type: 'repaid',
      amountMinor: toMinorUnits(25000),
      existingTransactions: existing,
    });
    expect(resExcess.valid).toBe(false);
    expect(resExcess.error).toContain('exceeds');

    // Valid repayment (<= 20,000)
    const resValid = validateAddTransaction({
      lenderId: personLender.id,
      type: 'repaid',
      amountMinor: toMinorUnits(15000),
      existingTransactions: existing,
    });
    expect(resValid.valid).toBe(true);
  });

  it('validates editing an existing transaction to prevent inconsistent states', () => {
    const existing: Transaction[] = [
      {
        id: 'tx-1',
        lenderId: personLender.id,
        type: 'borrowed',
        amountMinor: toMinorUnits(50000),
        date: '2026-10-11',
        createdAt: '2026-10-11T10:00:00Z',
        updatedAt: '2026-10-11T10:00:00Z',
      },
      {
        id: 'tx-2',
        lenderId: personLender.id,
        type: 'repaid',
        amountMinor: toMinorUnits(20000),
        date: '2026-10-11',
        createdAt: '2026-10-11T10:05:00Z',
        updatedAt: '2026-10-11T10:05:00Z',
      },
    ];

    // Cannot reduce tx-1 borrowing below 20,000 (which was already repaid)
    const editBorrowTooLow = validateEditTransaction({
      transactionId: 'tx-1',
      lenderId: personLender.id,
      newType: 'borrowed',
      newAmountMinor: toMinorUnits(10000),
      existingTransactions: existing,
    });
    expect(editBorrowTooLow.valid).toBe(false);

    // Can increase borrowing
    const editBorrowHigher = validateEditTransaction({
      transactionId: 'tx-1',
      lenderId: personLender.id,
      newType: 'borrowed',
      newAmountMinor: toMinorUnits(60000),
      existingTransactions: existing,
    });
    expect(editBorrowHigher.valid).toBe(true);

    // Cannot increase tx-2 repayment above 50,000
    const editRepayTooHigh = validateEditTransaction({
      transactionId: 'tx-2',
      lenderId: personLender.id,
      newType: 'repaid',
      newAmountMinor: toMinorUnits(55000),
      existingTransactions: existing,
    });
    expect(editRepayTooHigh.valid).toBe(false);
  });

  it('validates deleting a transaction to prevent repayments exceeding borrowings', () => {
    const existing: Transaction[] = [
      {
        id: 'tx-1',
        lenderId: personLender.id,
        type: 'borrowed',
        amountMinor: toMinorUnits(50000),
        date: '2026-10-11',
        createdAt: '2026-10-11T10:00:00Z',
        updatedAt: '2026-10-11T10:00:00Z',
      },
      {
        id: 'tx-2',
        lenderId: personLender.id,
        type: 'repaid',
        amountMinor: toMinorUnits(20000),
        date: '2026-10-11',
        createdAt: '2026-10-11T10:05:00Z',
        updatedAt: '2026-10-11T10:05:00Z',
      },
    ];

    // Cannot delete tx-1 (borrowing) because tx-2 (repayment 20k) remains without loans
    const delTx1 = validateDeleteTransaction({
      transactionId: 'tx-1',
      existingTransactions: existing,
    });
    expect(delTx1.valid).toBe(false);

    // Can delete tx-2 (repayment)
    const delTx2 = validateDeleteTransaction({
      transactionId: 'tx-2',
      existingTransactions: existing,
    });
    expect(delTx2.valid).toBe(true);
  });
});
