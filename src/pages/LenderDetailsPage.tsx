import React, { useState } from 'react';
import type { Lender, Transaction } from '../types';
import { calculateLenderSummary } from '../utils/calculations';
import { formatCurrency } from '../utils/currency';
import { TransactionItem } from '../components/TransactionItem';
import { EmptyState } from '../components/EmptyState';
import { ConfirmDialog } from '../components/ConfirmDialog';
import {
  User,
  Landmark,
  HelpCircle,
  Plus,
  Minus,
  Edit2,
  Trash2,
  Receipt,
  CheckCircle2,
} from 'lucide-react';

interface LenderDetailsPageProps {
  lender: Lender;
  transactions: Transaction[];
  currency: string;
  onAddTransaction: (type: 'borrowed' | 'repaid') => void;
  onEditTransaction: (transactionId: string) => void;
  onEditLender: () => void;
  onDeleteLender: () => void;
}

export const LenderDetailsPage: React.FC<LenderDetailsPageProps> = ({
  lender,
  transactions,
  currency,
  onAddTransaction,
  onEditTransaction,
  onEditLender,
  onDeleteLender,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const summary = calculateLenderSummary(lender, transactions);
  const lenderTxns = transactions
    .filter((t) => t.lenderId === lender.id)
    .sort((a, b) => {
      // Sort by date desc, then by createdAt desc
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      return b.createdAt.localeCompare(a.createdAt);
    });

  const renderTypeIcon = () => {
    switch (lender.type) {
      case 'person':
        return <User size={14} />;
      case 'bank':
        return <Landmark size={14} />;
      default:
        return <HelpCircle size={14} />;
    }
  };

  return (
    <div className="lender-details-page">
      {/* Top Header Card */}
      <div className="ios-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title" style={{ fontSize: 24, marginBottom: 6 }}>
              {lender.name}
            </h1>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span className={`badge badge-${lender.type}`}>
                {renderTypeIcon()} {lender.type}
              </span>
              {summary.isSettled && (
                <span className="badge badge-settled">
                  <CheckCircle2 size={12} strokeWidth={2.5} /> Settled
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            className="header-btn"
            onClick={onEditLender}
            style={{ padding: '6px 10px', fontSize: 14 }}
          >
            <Edit2 size={16} />
            <span>Edit</span>
          </button>
        </div>

        {lender.notes && (
          <div
            style={{
              marginTop: 12,
              padding: '10px 12px',
              backgroundColor: 'var(--bg-system)',
              borderRadius: 10,
              fontSize: 13,
              color: 'var(--text-secondary)',
              lineHeight: 1.4,
            }}
          >
            {lender.notes}
          </div>
        )}

        {/* Balance Display */}
        <div
          style={{
            marginTop: 16,
            paddingTop: 14,
            borderTop: '0.5px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
          }}
        >
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
            Outstanding Balance
          </span>
          <span
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: summary.isSettled ? 'var(--status-settled-color)' : 'var(--text-primary)',
            }}
          >
            {formatCurrency(summary.outstandingBalanceMinor, currency)}
          </span>
        </div>

        {/* Subtotals */}
        <div className="lender-card-subtotals" style={{ marginTop: 12 }}>
          <div className="subtotal-item">
            <span>Total Borrowed:</span>
            <span className="subtotal-val borrow">
              {formatCurrency(summary.totalBorrowedMinor, currency)}
            </span>
          </div>
          <div className="subtotal-item">
            <span>Total Repaid:</span>
            <span className="subtotal-val repay">
              {formatCurrency(summary.totalRepaidMinor, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="action-buttons-row">
        <button
          type="button"
          className="btn btn-borrow"
          onClick={() => onAddTransaction('borrowed')}
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>Add Borrowing</span>
        </button>

        <button
          type="button"
          className="btn btn-repay"
          onClick={() => onAddTransaction('repaid')}
          disabled={summary.outstandingBalanceMinor === 0}
          style={{
            opacity: summary.outstandingBalanceMinor === 0 ? 0.45 : 1,
            cursor: summary.outstandingBalanceMinor === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          <Minus size={18} strokeWidth={2.5} />
          <span>Record Repayment</span>
        </button>
      </div>

      {/* Transactions Section */}
      <div className="section-header">
        <h2 className="section-title">Transactions</h2>
        <span className="section-count">{lenderTxns.length}</span>
      </div>

      {lenderTxns.length === 0 ? (
        <EmptyState
          icon={<Receipt size={30} />}
          title="No Transactions"
          description="Record a borrowing or repayment transaction for this lender."
          actionLabel="Add Loan"
          onAction={() => onAddTransaction('borrowed')}
        />
      ) : (
        <div className="transaction-list">
          {lenderTxns.map((txn) => (
            <TransactionItem
              key={txn.id}
              transaction={txn}
              currency={currency}
              onClick={() => onEditTransaction(txn.id)}
            />
          ))}
        </div>
      )}

      {/* Delete Lender Button */}
      <div style={{ marginTop: 36, marginBottom: 20 }}>
        <button
          type="button"
          className="btn btn-outline-destructive"
          onClick={() => setShowDeleteConfirm(true)}
        >
          <Trash2 size={18} />
          <span>Delete Lender</span>
        </button>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title={`Delete ${lender.name}?`}
        message={`Are you sure you want to delete ${lender.name}? This will permanently delete the lender and all ${lenderTxns.length} associated transaction records. This action cannot be undone.`}
        confirmLabel="Delete Lender"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={() => {
          setShowDeleteConfirm(false);
          onDeleteLender();
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};
