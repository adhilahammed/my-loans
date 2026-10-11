import React from 'react';
import type { Lender, Transaction, OverallSummary } from '../types';
import { calculateLenderSummary } from '../utils/calculations';
import { formatCurrency } from '../utils/currency';
import { LenderCard } from '../components/LenderCard';
import { EmptyState } from '../components/EmptyState';
import { Plus, Users } from 'lucide-react';

interface LoansPageProps {
  lenders: Lender[];
  transactions: Transaction[];
  overall: OverallSummary;
  currency: string;
  onOpenLender: (lenderId: string) => void;
  onAddLender: () => void;
}

export const LoansPage: React.FC<LoansPageProps> = ({
  lenders,
  transactions,
  overall,
  currency,
  onOpenLender,
  onAddLender,
}) => {
  return (
    <div className="loans-page">
      {/* Title & Subtitle */}
      <div className="page-intro">
        <h1 className="page-title">My Loans</h1>
        <p className="page-subtitle">Track your borrowed and repaid amounts</p>
      </div>

      {/* Overall Balance Summary Card */}
      <div className="overall-card">
        <div className="overall-label">Total Outstanding Balance</div>
        <div className="overall-amount">
          {formatCurrency(overall.totalOutstandingMinor, currency)}
        </div>

        <div className="overall-metrics-grid">
          <div>
            <div className="overall-metric-label">Total Borrowed</div>
            <div className="overall-metric-value borrow">
              {formatCurrency(overall.totalBorrowedMinor, currency)}
            </div>
          </div>
          <div>
            <div className="overall-metric-label">Total Repaid</div>
            <div className="overall-metric-value repay">
              {formatCurrency(overall.totalRepaidMinor, currency)}
            </div>
          </div>
        </div>
      </div>

      {/* Lenders List Header */}
      <div className="section-header">
        <h2 className="section-title">Lenders</h2>
        <span className="section-count">{lenders.length}</span>
      </div>

      {/* Lenders List or Empty State */}
      {lenders.length === 0 ? (
        <EmptyState
          icon={<Users size={32} />}
          title="No Lenders Added"
          description="Add a person, bank, or organization you borrowed money from or repaid."
          actionLabel="Add First Lender"
          onAction={onAddLender}
        />
      ) : (
        <div className="lender-list">
          {lenders.map((lender) => {
            const summary = calculateLenderSummary(lender, transactions);
            return (
              <LenderCard
                key={lender.id}
                summary={summary}
                currency={currency}
                onClick={() => onOpenLender(lender.id)}
              />
            );
          })}
        </div>
      )}

      {/* Add Lender Button */}
      <div style={{ marginTop: 20 }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onAddLender}
        >
          <Plus size={20} strokeWidth={2.4} />
          <span>Add Lender</span>
        </button>
      </div>
    </div>
  );
};
