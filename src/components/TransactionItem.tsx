import React from 'react';
import type { Transaction } from '../types';
import { formatCurrency } from '../utils/currency';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface TransactionItemProps {
  transaction: Transaction;
  lenderName?: string;
  currency: string;
  onClick: () => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  lenderName,
  currency,
  onClick,
}) => {
  const isBorrowed = transaction.type === 'borrowed';

  const formatDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-');
      if (!year || !month || !day) return dateStr;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return date.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      className="transaction-item"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`${transaction.type} transaction of ${formatCurrency(transaction.amountMinor, currency)}`}
    >
      <div className="transaction-left">
        <div className={`transaction-icon-box ${isBorrowed ? 'borrow' : 'repay'}`}>
          {isBorrowed ? (
            <ArrowDownLeft size={18} strokeWidth={2.4} />
          ) : (
            <ArrowUpRight size={18} strokeWidth={2.4} />
          )}
        </div>

        <div className="transaction-details">
          <div className="transaction-title">
            {lenderName ? lenderName : isBorrowed ? 'Loan Borrowed' : 'Repayment'}
          </div>
          <div className="transaction-subtitle">
            <span>{formatDate(transaction.date)}</span>
            {transaction.description && (
              <>
                <span>•</span>
                <span
                  style={{
                    maxWidth: 140,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {transaction.description}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="transaction-right">
        <div className={`transaction-amount ${isBorrowed ? 'borrow' : 'repay'}`}>
          {isBorrowed ? '+' : '-'}{formatCurrency(transaction.amountMinor, currency)}
        </div>
        <span
          className={`badge ${isBorrowed ? 'badge-borrowed' : 'badge-repaid'}`}
          style={{ fontSize: 11, padding: '2px 6px', marginTop: 3 }}
        >
          {isBorrowed ? 'Borrowed' : 'Repaid'}
        </span>
      </div>
    </div>
  );
};
