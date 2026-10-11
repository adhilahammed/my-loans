import React, { useState, useMemo } from 'react';
import type { Lender, Transaction, TransactionType } from '../types';
import { TransactionItem } from '../components/TransactionItem';
import { SegmentedControl } from '../components/SegmentedControl';
import { EmptyState } from '../components/EmptyState';
import { Search, X, Receipt } from 'lucide-react';

interface HistoryPageProps {
  transactions: Transaction[];
  lenders: Lender[];
  currency: string;
  onEditTransaction: (transactionId: string) => void;
  onAddTransaction: () => void;
}

type FilterType = 'all' | TransactionType;

export const HistoryPage: React.FC<HistoryPageProps> = ({
  transactions,
  lenders,
  currency,
  onEditTransaction,
  onAddTransaction,
}) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Map lender IDs to lender names for fast lookup
  const lenderMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const l of lenders) {
      map.set(l.id, l.name);
    }
    return map;
  }, [lenders]);

  const filterOptions: { label: string; value: FilterType }[] = [
    { label: 'All', value: 'all' },
    { label: 'Borrowed', value: 'borrowed' },
    { label: 'Repaid', value: 'repaid' },
  ];

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        // Filter by type
        if (filter !== 'all' && t.type !== filter) return false;

        // Filter by search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const lenderName = (lenderMap.get(t.lenderId) || '').toLowerCase();
          const desc = (t.description || '').toLowerCase();
          return lenderName.includes(q) || desc.includes(q);
        }

        return true;
      })
      .sort((a, b) => {
        if (b.date !== a.date) return b.date.localeCompare(a.date);
        return b.createdAt.localeCompare(a.createdAt);
      });
  }, [transactions, filter, searchQuery, lenderMap]);

  return (
    <div className="history-page">
      <div className="page-intro">
        <h1 className="page-title">History</h1>
        <p className="page-subtitle">All transactions across all lenders</p>
      </div>

      {/* Filter Segmented Control */}
      <SegmentedControl<FilterType>
        options={filterOptions}
        value={filter}
        onChange={(val) => setFilter(val)}
        ariaLabel="Filter Transactions"
      />

      {/* Search Input */}
      <div className="search-container">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Search by lender or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoComplete="off"
        />
        {searchQuery && (
          <button
            type="button"
            className="search-clear"
            onClick={() => setSearchQuery('')}
            aria-label="Clear Search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Transactions List Header */}
      <div className="section-header">
        <h2 className="section-title">
          {filter === 'all'
            ? 'All Records'
            : filter === 'borrowed'
            ? 'Loans Borrowed'
            : 'Repayments'}
        </h2>
        <span className="section-count">{filteredTransactions.length}</span>
      </div>

      {/* Transactions or Empty State */}
      {filteredTransactions.length === 0 ? (
        transactions.length === 0 ? (
          <EmptyState
            icon={<Receipt size={32} />}
            title="No Transactions Yet"
            description="Your loan borrowings and repayments will appear here."
            actionLabel="Add Transaction"
            onAction={onAddTransaction}
          />
        ) : (
          <EmptyState
            icon={<Search size={32} />}
            title="No Matching Transactions"
            description="Try modifying your search or filter criteria."
            actionLabel="Clear Filters"
            onAction={() => {
              setFilter('all');
              setSearchQuery('');
            }}
          />
        )
      ) : (
        <div className="transaction-list">
          {filteredTransactions.map((txn) => {
            const lenderName = lenderMap.get(txn.lenderId) || 'Unknown Lender';
            return (
              <TransactionItem
                key={txn.id}
                transaction={txn}
                lenderName={lenderName}
                currency={currency}
                onClick={() => onEditTransaction(txn.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
