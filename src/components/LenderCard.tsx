import React from 'react';
import type { LenderSummary } from '../types';
import { formatCurrency } from '../utils/currency';
import { User, Landmark, HelpCircle, CheckCircle2 } from 'lucide-react';

interface LenderCardProps {
  summary: LenderSummary;
  currency: string;
  onClick: () => void;
}

export const LenderCard: React.FC<LenderCardProps> = ({
  summary,
  currency,
  onClick,
}) => {
  const { lender, totalBorrowedMinor, totalRepaidMinor, outstandingBalanceMinor, isSettled } =
    summary;

  const renderTypeIcon = () => {
    switch (lender.type) {
      case 'person':
        return <User size={13} />;
      case 'bank':
        return <Landmark size={13} />;
      default:
        return <HelpCircle size={13} />;
    }
  };

  return (
    <div
      className="ios-card interactive"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`View details for ${lender.name}`}
    >
      <div className="lender-card-top">
        <div className="lender-name-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className="lender-name">{lender.name}</span>
            {isSettled && (
              <span className="badge badge-settled">
                <CheckCircle2 size={12} strokeWidth={2.5} /> Settled
              </span>
            )}
          </div>
          <div>
            <span className={`badge badge-${lender.type}`}>
              {renderTypeIcon()} {lender.type}
            </span>
          </div>
        </div>

        <div className="lender-balance-group">
          <span className="lender-balance-label">Balance</span>
          <div
            className="lender-balance-amount"
            style={{ color: isSettled ? 'var(--status-settled-color)' : 'var(--text-primary)' }}
          >
            {formatCurrency(outstandingBalanceMinor, currency)}
          </div>
        </div>
      </div>

      <div className="lender-card-subtotals">
        <div className="subtotal-item">
          <span>Borrowed:</span>
          <span className="subtotal-val borrow">
            {formatCurrency(totalBorrowedMinor, currency)}
          </span>
        </div>
        <div className="subtotal-item">
          <span>Repaid:</span>
          <span className="subtotal-val repay">
            {formatCurrency(totalRepaidMinor, currency)}
          </span>
        </div>
      </div>
    </div>
  );
};
