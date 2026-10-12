import type { Lender, Transaction } from '../types';
import { calculateLenderSummary } from './calculations';
import { formatCurrency } from './currency';

/**
 * Escapes CSV special characters (commas, quotes, newlines) according to RFC 4180.
 */
export function escapeCsvField(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates CSV document containing only:
 * - The name (person/bank)
 * - How much left to pay for each
 */
export function generateLoansStatementCsv(
  lenders: Lender[],
  transactions: Transaction[],
  currency: string = 'INR'
): string {
  const headers = ['Name', 'Type (Person/Bank)', 'Left to Pay'];

  const rows: string[] = [headers.map(escapeCsvField).join(',')];

  if (lenders.length === 0) {
    rows.push(
      [
        'No lenders recorded',
        '-',
        formatCurrency(0, currency),
      ]
        .map(escapeCsvField)
        .join(',')
    );
    return rows.join('\r\n');
  }

  for (const lender of lenders) {
    const summary = calculateLenderSummary(lender, transactions);
    const typeLabel =
      lender.type === 'person'
        ? 'Person'
        : lender.type === 'bank'
          ? 'Bank'
          : 'Other';

    rows.push(
      [
        lender.name,
        typeLabel,
        formatCurrency(summary.outstandingBalanceMinor, currency),
      ]
        .map(escapeCsvField)
        .join(',')
    );
  }

  return rows.join('\r\n');
}

/**
 * Triggers the browser download of the loan statement document as a CSV file.
 */
export function downloadLoanStatementDocument(
  lenders: Lender[],
  transactions: Transaction[],
  currency: string = 'INR'
): { success: boolean; filename: string; count: number } {
  try {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return { success: false, filename: '', count: 0 };
    }

    const csvContent = generateLoansStatementCsv(lenders, transactions, currency);
    // Add UTF-8 BOM so Excel and spreadsheet apps display currency symbols like ₹ correctly
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `my-loans-left-to-pay-${dateStr}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return {
      success: true,
      filename,
      count: lenders.length,
    };
  } catch (error) {
    console.error('Failed to download loan statement:', error);
    return {
      success: false,
      filename: '',
      count: 0,
    };
  }
}
