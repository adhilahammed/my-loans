import { describe, it, expect, vi } from 'vitest';
import type { Lender, Transaction } from '../types';
import {
  escapeCsvField,
  generateLoansStatementCsv,
  downloadLoanStatementDocument,
} from './report';
import { toMinorUnits } from './currency';

describe('Loan Statement Document Generation & Download', () => {
  const sampleLenders: Lender[] = [
    {
      id: 'lender-1',
      name: 'Rahul Sharma',
      type: 'person',
      createdAt: '2026-10-10T10:00:00Z',
      updatedAt: '2026-10-10T10:00:00Z',
    },
    {
      id: 'lender-2',
      name: 'HDFC Bank, Main Branch',
      type: 'bank',
      createdAt: '2026-10-10T10:00:00Z',
      updatedAt: '2026-10-10T10:00:00Z',
    },
  ];

  const sampleTransactions: Transaction[] = [
    // Rahul: Borrowed 50,000, Repaid 10,000 -> Left to pay 40,000
    {
      id: 'tx-1',
      lenderId: 'lender-1',
      type: 'borrowed',
      amountMinor: toMinorUnits(50000),
      date: '2026-10-10',
      createdAt: '2026-10-10T10:05:00Z',
      updatedAt: '2026-10-10T10:05:00Z',
    },
    {
      id: 'tx-2',
      lenderId: 'lender-1',
      type: 'repaid',
      amountMinor: toMinorUnits(10000),
      date: '2026-10-11',
      createdAt: '2026-10-11T10:05:00Z',
      updatedAt: '2026-10-11T10:05:00Z',
    },
    // HDFC: Borrowed 25,000, Repaid 0 -> Left to pay 25,000
    {
      id: 'tx-3',
      lenderId: 'lender-2',
      type: 'borrowed',
      amountMinor: toMinorUnits(25000),
      date: '2026-10-10',
      createdAt: '2026-10-10T10:10:00Z',
      updatedAt: '2026-10-10T10:10:00Z',
    },
  ];

  it('escapes CSV fields containing commas and quotes properly', () => {
    expect(escapeCsvField('Simple')).toBe('Simple');
    expect(escapeCsvField('HDFC, Bank')).toBe('"HDFC, Bank"');
    expect(escapeCsvField('He said "Hello"')).toBe('"He said ""Hello"""');
    expect(escapeCsvField('Line 1\nLine 2')).toBe('"Line 1\nLine 2"');
    expect(escapeCsvField(undefined)).toBe('');
    expect(escapeCsvField(null)).toBe('');
  });

  it('generates CSV with empty message when no lenders exist', () => {
    const csv = generateLoansStatementCsv([], [], 'INR');
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('Name,Type (Person/Bank),Left to Pay');
    expect(lines[1]).toContain('No lenders recorded');
  });

  it('generates CSV containing only Name, Type (Person/Bank), and Left to Pay for each lender', () => {
    const csv = generateLoansStatementCsv(sampleLenders, sampleTransactions, 'INR');
    const lines = csv.split('\r\n');

    // Header validation: strictly Name, Type (Person/Bank), Left to Pay
    expect(lines[0]).toBe('Name,Type (Person/Bank),Left to Pay');

    // Exactly 3 lines (1 header + 2 lenders)
    expect(lines).toHaveLength(3);

    // Row 1: Rahul Sharma, Person, ₹40,000
    expect(lines[1]).toContain('Rahul Sharma');
    expect(lines[1]).toContain('Person');
    expect(lines[1]).toContain('40,000');

    // Row 2: HDFC Bank, Main Branch (properly escaped due to comma), Bank, ₹25,000
    expect(lines[2]).toContain('"HDFC Bank, Main Branch"');
    expect(lines[2]).toContain('Bank');
    expect(lines[2]).toContain('25,000');
  });

  it('correctly handles settled lenders with 0 left to pay', () => {
    const settledTransactions: Transaction[] = [
      ...sampleTransactions,
      {
        id: 'tx-4',
        lenderId: 'lender-1',
        type: 'repaid',
        amountMinor: toMinorUnits(40000), // fully settled
        date: '2026-10-12',
        createdAt: '2026-10-12T10:00:00Z',
        updatedAt: '2026-10-12T10:00:00Z',
      },
    ];

    const csv = generateLoansStatementCsv(sampleLenders, settledTransactions, 'INR');
    const lines = csv.split('\r\n');
    expect(lines[1]).toContain('Rahul Sharma');
    expect(lines[1]).toContain('0');
  });

  it('handles non-browser (Node/SSR) environment safely', () => {
    const result = downloadLoanStatementDocument(sampleLenders, sampleTransactions, 'INR');
    expect(result.success).toBe(false);
  });

  it('triggers download when document and window are available', () => {
    const clickMock = vi.fn();
    const mockElement = {
      setAttribute: vi.fn(),
      style: {},
      click: clickMock,
    };

    const originalDoc = globalThis.document;
    const originalWin = globalThis.window;

    const mockBody = {
      appendChild: vi.fn(),
      removeChild: vi.fn(),
    };

    const mockDoc = {
      createElement: vi.fn().mockReturnValue(mockElement),
      body: mockBody,
    };

    const mockWin = {
      location: {},
    };

    // @ts-ignore
    globalThis.document = mockDoc;
    // @ts-ignore
    globalThis.window = mockWin;
    // @ts-ignore
    globalThis.URL = {
      createObjectURL: vi.fn().mockReturnValue('blob:mock-url'),
      revokeObjectURL: vi.fn(),
    };

    const result = downloadLoanStatementDocument(sampleLenders, sampleTransactions, 'INR');
    expect(result.success).toBe(true);
    expect(result.filename).toMatch(/my-loans-left-to-pay-\d{4}-\d{2}-\d{2}\.csv/);
    expect(result.count).toBe(2);
    expect(clickMock).toHaveBeenCalled();
    expect(mockBody.appendChild).toHaveBeenCalled();
    expect(mockBody.removeChild).toHaveBeenCalled();

    // Restore
    // @ts-ignore
    globalThis.document = originalDoc;
    // @ts-ignore
    globalThis.window = originalWin;
  });
});
