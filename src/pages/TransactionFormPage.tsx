import React, { useState } from 'react';
import type {
  Lender,
  Transaction,
  TransactionType,
} from '../types';
import {
  toMinorUnits,
  fromMinorUnits,
  parseAmountInput,
  formatCurrency,
} from '../utils/currency';
import {
  validateAddTransaction,
  validateEditTransaction,
  validateDeleteTransaction,
  calculateLenderSummary,
} from '../utils/calculations';
import { SegmentedControl } from '../components/SegmentedControl';
import { ConfirmDialog } from '../components/ConfirmDialog';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  Trash2,
  AlertCircle,
  Info,
} from 'lucide-react';

interface TransactionFormPageProps {
  initialTransaction?: Transaction;
  defaultLenderId?: string;
  defaultType?: TransactionType;
  lenders: Lender[];
  transactions: Transaction[];
  currency: string;
  onSave: (transactionData: {
    lenderId: string;
    type: TransactionType;
    amountMinor: number;
    date: string;
    description?: string;
  }) => void;
  onDelete?: (transactionId: string) => void;
  onCancel: () => void;
}

export const TransactionFormPage: React.FC<TransactionFormPageProps> = ({
  initialTransaction,
  defaultLenderId,
  defaultType = 'borrowed',
  lenders,
  transactions,
  currency,
  onSave,
  onDelete,
  onCancel,
}) => {
  const isEditing = Boolean(initialTransaction);

  const [selectedLenderId, setSelectedLenderId] = useState<string>(
    initialTransaction?.lenderId || defaultLenderId || (lenders[0]?.id ?? '')
  );

  const [type, setType] = useState<TransactionType>(
    initialTransaction?.type || defaultType
  );

  const [amountStr, setAmountStr] = useState<string>(
    initialTransaction
      ? fromMinorUnits(initialTransaction.amountMinor).toString()
      : ''
  );

  const getTodayDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [date, setDate] = useState<string>(
    initialTransaction?.date || getTodayDate()
  );

  const [description, setDescription] = useState<string>(
    initialTransaction?.description || ''
  );

  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Selected lender object
  const currentLender = lenders.find((l) => l.id === selectedLenderId);
  const currentLenderSummary = currentLender
    ? calculateLenderSummary(currentLender, transactions)
    : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedLenderId) {
      setError('Please select a lender.');
      return;
    }

    const parsedMajor = parseAmountInput(amountStr);
    if (parsedMajor === null || parsedMajor <= 0) {
      setError('Please enter a valid amount greater than zero.');
      return;
    }

    if (!date) {
      setError('Please select a valid date.');
      return;
    }

    const amountMinor = toMinorUnits(parsedMajor);

    if (isEditing && initialTransaction) {
      const val = validateEditTransaction({
        transactionId: initialTransaction.id,
        lenderId: selectedLenderId,
        newType: type,
        newAmountMinor: amountMinor,
        existingTransactions: transactions,
        currencyCode: currency,
      });

      if (!val.valid) {
        setError(val.error || 'Invalid transaction update.');
        return;
      }
    } else {
      const val = validateAddTransaction({
        lenderId: selectedLenderId,
        type,
        amountMinor,
        existingTransactions: transactions,
        currencyCode: currency,
      });

      if (!val.valid) {
        setError(val.error || 'Invalid transaction.');
        return;
      }
    }

    onSave({
      lenderId: selectedLenderId,
      type,
      amountMinor,
      date,
      description: description.trim() || undefined,
    });
  };

  const handleDelete = () => {
    if (!initialTransaction || !onDelete) return;

    const val = validateDeleteTransaction({
      transactionId: initialTransaction.id,
      existingTransactions: transactions,
      currencyCode: currency,
    });

    if (!val.valid) {
      setError(val.error || 'Cannot delete transaction.');
      setShowDeleteConfirm(false);
      return;
    }

    onDelete(initialTransaction.id);
  };

  const typeOptions: { label: string; value: TransactionType; icon: React.ReactNode }[] = [
    { label: 'Borrowed', value: 'borrowed', icon: <ArrowDownLeft size={16} /> },
    { label: 'Repaid', value: 'repaid', icon: <ArrowUpRight size={16} /> },
  ];

  return (
    <div className="transaction-form-page">
      <div className="page-intro">
        <h1 className="page-title">
          {isEditing ? 'Edit Transaction' : type === 'borrowed' ? 'Add Borrowing' : 'Record Repayment'}
        </h1>
        <p className="page-subtitle">
          {type === 'borrowed'
            ? 'Records loan borrowed, increasing outstanding balance.'
            : 'Records money repaid, decreasing outstanding balance.'}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="ios-card">
          {/* Type Toggle */}
          <div className="form-group">
            <label className="form-label">Transaction Type</label>
            <SegmentedControl<TransactionType>
              options={typeOptions}
              value={type}
              onChange={(val) => {
                setType(val);
                if (error) setError(null);
              }}
              ariaLabel="Transaction Type"
            />
          </div>

          {/* Lender Select */}
          <div className="form-group">
            <label htmlFor="txn-lender-select" className="form-label">
              Lender <span style={{ color: 'var(--repay-color)' }}>*</span>
            </label>
            {defaultLenderId && !isEditing ? (
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--bg-system)',
                  borderRadius: 12,
                  fontWeight: 600,
                  fontSize: 16,
                  color: 'var(--text-primary)',
                }}
              >
                {currentLender?.name || 'Selected Lender'}
              </div>
            ) : (
              <select
                id="txn-lender-select"
                className="form-select"
                value={selectedLenderId}
                onChange={(e) => {
                  setSelectedLenderId(e.target.value);
                  if (error) setError(null);
                }}
              >
                {lenders.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.type})
                  </option>
                ))}
              </select>
            )}
            {currentLenderSummary && (
              <div className="form-help" style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                <Info size={13} />
                <span>
                  Current Outstanding:{' '}
                  <strong>
                    {formatCurrency(currentLenderSummary.outstandingBalanceMinor, currency)}
                  </strong>
                </span>
              </div>
            )}
          </div>

          {/* Amount Field */}
          <div className="form-group">
            <label htmlFor="txn-amount-input" className="form-label">
              Amount <span style={{ color: 'var(--repay-color)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="txn-amount-input"
                type="number"
                inputMode="decimal"
                step="any"
                min="0.01"
                placeholder="0.00"
                className="form-input"
                style={{ fontSize: 18, fontWeight: 600 }}
                value={amountStr}
                onChange={(e) => {
                  setAmountStr(e.target.value);
                  if (error) setError(null);
                }}
                autoFocus={!isEditing}
              />
            </div>
            {type === 'repaid' && currentLenderSummary && (
              <div className="form-help">
                Max repayment allowed:{' '}
                {formatCurrency(currentLenderSummary.outstandingBalanceMinor, currency)}
              </div>
            )}
          </div>

          {/* Date Field */}
          <div className="form-group">
            <label htmlFor="txn-date-input" className="form-label">
              Date <span style={{ color: 'var(--repay-color)' }}>*</span>
            </label>
            <input
              id="txn-date-input"
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                if (error) setError(null);
              }}
            />
          </div>

          {/* Optional Description */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="txn-desc-input" className="form-label">
              Description (Optional)
            </label>
            <input
              id="txn-desc-input"
              type="text"
              className="form-input"
              placeholder="e.g. Travel loan, EMI #2, Wedding expenses"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              autoCapitalize="sentences"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="form-error" style={{ marginTop: 14 }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
          <button type="submit" className="btn btn-primary">
            <Check size={18} strokeWidth={2.5} />
            <span>{isEditing ? 'Save Changes' : 'Save Transaction'}</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
          >
            Cancel
          </button>

          {isEditing && onDelete && (
            <button
              type="button"
              className="btn btn-outline-destructive"
              style={{ marginTop: 10 }}
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 size={18} />
              <span>Delete Transaction</span>
            </button>
          )}
        </div>
      </form>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Transaction?"
        message="Are you sure you want to permanently delete this transaction record? All lender balances will be recalculated immediately."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};
