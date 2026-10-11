import { useState, useEffect, useMemo, useCallback } from 'react';
import type {
  Lender,
  Transaction,
  AppSettings,
  Route,
  ActiveTab,
  LenderType,
  TransactionType,
} from './types';
import {
  loadLenders,
  saveLenders,
  loadTransactions,
  saveTransactions,
  loadSettings,
  saveSettings,
  clearAllData,
} from './utils/storage';
import { calculateOverallSummary } from './utils/calculations';
import { Header } from './components/Header';
import { BottomNavigation } from './components/BottomNavigation';
import { LoansPage } from './pages/LoansPage';
import { LenderDetailsPage } from './pages/LenderDetailsPage';
import { AddEditLenderPage } from './pages/AddEditLenderPage';
import { TransactionFormPage } from './pages/TransactionFormPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import './styles.css';

export function App() {
  const [lenders, setLenders] = useState<Lender[]>(() => loadLenders());
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    loadTransactions()
  );
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());

  // Navigation route parsing from hash
  const parseRouteFromHash = useCallback((): Route => {
    const hash = window.location.hash.replace(/^#\/?/, '');
    if (!hash || hash === 'loans') return { view: 'loans' };
    if (hash === 'history') return { view: 'history' };
    if (hash === 'settings') return { view: 'settings' };
    if (hash === 'add-lender') return { view: 'add-lender' };

    if (hash.startsWith('lender/')) {
      const lenderId = hash.replace('lender/', '');
      return { view: 'lender-detail', lenderId };
    }
    if (hash.startsWith('edit-lender/')) {
      const lenderId = hash.replace('edit-lender/', '');
      return { view: 'edit-lender', lenderId };
    }
    if (hash.startsWith('add-transaction')) {
      // Check for query params if any, e.g. #add-transaction?lenderId=123&type=repaid
      const [_, search] = hash.split('?');
      const params = new URLSearchParams(search || '');
      const lenderId = params.get('lenderId') || undefined;
      const type = (params.get('type') as TransactionType) || undefined;
      return { view: 'add-transaction', lenderId, defaultType: type };
    }
    if (hash.startsWith('edit-transaction/')) {
      const transactionId = hash.replace('edit-transaction/', '');
      return { view: 'edit-transaction', transactionId };
    }

    return { view: 'loans' };
  }, []);

  const [route, setRoute] = useState<Route>(parseRouteFromHash);

  // Sync route with window.location.hash
  const navigateTo = useCallback((newRoute: Route) => {
    let newHash = '';
    switch (newRoute.view) {
      case 'loans':
        newHash = '#loans';
        break;
      case 'history':
        newHash = '#history';
        break;
      case 'settings':
        newHash = '#settings';
        break;
      case 'add-lender':
        newHash = '#add-lender';
        break;
      case 'lender-detail':
        newHash = `#lender/${newRoute.lenderId}`;
        break;
      case 'edit-lender':
        newHash = `#edit-lender/${newRoute.lenderId}`;
        break;
      case 'add-transaction': {
        const params = new URLSearchParams();
        if (newRoute.lenderId) params.set('lenderId', newRoute.lenderId);
        if (newRoute.defaultType) params.set('type', newRoute.defaultType);
        const query = params.toString();
        newHash = `#add-transaction${query ? `?${query}` : ''}`;
        break;
      }
      case 'edit-transaction':
        newHash = `#edit-transaction/${newRoute.transactionId}`;
        break;
    }
    window.location.hash = newHash;
    setRoute(newRoute);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  // Listen to browser hash change (back/forward gestures on iOS Safari)
  useEffect(() => {
    const handleHashChange = () => {
      setRoute(parseRouteFromHash());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [parseRouteFromHash]);

  // Derived current tab for bottom nav
  const activeTab: ActiveTab = useMemo(() => {
    if (route.view === 'history') return 'history';
    if (route.view === 'settings') return 'settings';
    return 'loans';
  }, [route.view]);

  // Calculate overall summary across all lenders
  const overallSummary = useMemo(() => {
    return calculateOverallSummary(lenders, transactions);
  }, [lenders, transactions]);

  // Handle Tab Switch
  const handleTabChange = (tab: ActiveTab) => {
    if (tab === 'loans') navigateTo({ view: 'loans' });
    else if (tab === 'history') navigateTo({ view: 'history' });
    else if (tab === 'settings') navigateTo({ view: 'settings' });
  };

  // Lender Management Actions
  const handleCreateLender = (data: {
    name: string;
    type: LenderType;
    notes?: string;
  }) => {
    const newLender: Lender = {
      id: `lender_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: data.name,
      type: data.type,
      notes: data.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newLender, ...lenders];
    setLenders(updated);
    saveLenders(updated);
    navigateTo({ view: 'lender-detail', lenderId: newLender.id });
  };

  const handleUpdateLender = (
    lenderId: string,
    data: { name: string; type: LenderType; notes?: string }
  ) => {
    const updated = lenders.map((l) =>
      l.id === lenderId
        ? {
            ...l,
            name: data.name,
            type: data.type,
            notes: data.notes,
            updatedAt: new Date().toISOString(),
          }
        : l
    );
    setLenders(updated);
    saveLenders(updated);
    navigateTo({ view: 'lender-detail', lenderId });
  };

  const handleDeleteLender = (lenderId: string) => {
    const updatedLenders = lenders.filter((l) => l.id !== lenderId);
    const updatedTxns = transactions.filter((t) => t.lenderId !== lenderId);
    setLenders(updatedLenders);
    setTransactions(updatedTxns);
    saveLenders(updatedLenders);
    saveTransactions(updatedTxns);
    navigateTo({ view: 'loans' });
  };

  // Transaction Management Actions
  const handleCreateTransaction = (data: {
    lenderId: string;
    type: TransactionType;
    amountMinor: number;
    date: string;
    description?: string;
  }) => {
    const newTxn: Transaction = {
      id: `txn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      lenderId: data.lenderId,
      type: data.type,
      amountMinor: data.amountMinor,
      date: data.date,
      description: data.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newTxn, ...transactions];
    setTransactions(updated);
    saveTransactions(updated);
    navigateTo({ view: 'lender-detail', lenderId: data.lenderId });
  };

  const handleUpdateTransaction = (
    transactionId: string,
    data: {
      lenderId: string;
      type: TransactionType;
      amountMinor: number;
      date: string;
      description?: string;
    }
  ) => {
    const updated = transactions.map((t) =>
      t.id === transactionId
        ? {
            ...t,
            lenderId: data.lenderId,
            type: data.type,
            amountMinor: data.amountMinor,
            date: data.date,
            description: data.description,
            updatedAt: new Date().toISOString(),
          }
        : t
    );
    setTransactions(updated);
    saveTransactions(updated);
    navigateTo({ view: 'lender-detail', lenderId: data.lenderId });
  };

  const handleDeleteTransaction = (transactionId: string) => {
    const txn = transactions.find((t) => t.id === transactionId);
    const updated = transactions.filter((t) => t.id !== transactionId);
    setTransactions(updated);
    saveTransactions(updated);
    if (txn) {
      navigateTo({ view: 'lender-detail', lenderId: txn.lenderId });
    } else {
      navigateTo({ view: 'history' });
    }
  };

  // Settings Actions
  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleClearAllData = () => {
    clearAllData();
    setLenders([]);
    setTransactions([]);
    navigateTo({ view: 'loans' });
  };

  const handleDataReload = () => {
    setLenders(loadLenders());
    setTransactions(loadTransactions());
    setSettings(loadSettings());
  };

  // Header Title and Back Navigation resolution
  const renderHeader = () => {
    switch (route.view) {
      case 'loans':
        return <Header title="My Loans" />;
      case 'history':
        return <Header title="Transaction History" />;
      case 'settings':
        return <Header title="Settings" />;
      case 'lender-detail': {
        const lender = lenders.find((l) => l.id === route.lenderId);
        return (
          <Header
            title={lender?.name || 'Lender Details'}
            onBack={() => navigateTo({ view: 'loans' })}
            backLabel="Loans"
          />
        );
      }
      case 'add-lender':
        return (
          <Header
            title="Add Lender"
            onBack={() => navigateTo({ view: 'loans' })}
            backLabel="Back"
          />
        );
      case 'edit-lender':
        return (
          <Header
            title="Edit Lender"
            onBack={() =>
              navigateTo({ view: 'lender-detail', lenderId: route.lenderId })
            }
            backLabel="Details"
          />
        );
      case 'add-transaction':
        return (
          <Header
            title="New Transaction"
            onBack={() => {
              if (route.lenderId) {
                navigateTo({ view: 'lender-detail', lenderId: route.lenderId });
              } else {
                navigateTo({ view: 'history' });
              }
            }}
            backLabel="Back"
          />
        );
      case 'edit-transaction': {
        const txn = transactions.find((t) => t.id === route.transactionId);
        return (
          <Header
            title="Edit Transaction"
            onBack={() => {
              if (txn) {
                navigateTo({ view: 'lender-detail', lenderId: txn.lenderId });
              } else {
                navigateTo({ view: 'history' });
              }
            }}
            backLabel="Back"
          />
        );
      }
      default:
        return <Header title="My Loans" />;
    }
  };

  // Render Page Content
  const renderContent = () => {
    switch (route.view) {
      case 'loans':
        return (
          <LoansPage
            lenders={lenders}
            transactions={transactions}
            overall={overallSummary}
            currency={settings.currency}
            onOpenLender={(id) => navigateTo({ view: 'lender-detail', lenderId: id })}
            onAddLender={() => navigateTo({ view: 'add-lender' })}
          />
        );

      case 'lender-detail': {
        const lender = lenders.find((l) => l.id === route.lenderId);
        if (!lender) {
          return (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p>Lender not found or has been deleted.</p>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ marginTop: 16 }}
                onClick={() => navigateTo({ view: 'loans' })}
              >
                Back to Loans
              </button>
            </div>
          );
        }
        return (
          <LenderDetailsPage
            lender={lender}
            transactions={transactions}
            currency={settings.currency}
            onAddTransaction={(type) =>
              navigateTo({
                view: 'add-transaction',
                lenderId: lender.id,
                defaultType: type,
              })
            }
            onEditTransaction={(txnId) =>
              navigateTo({ view: 'edit-transaction', transactionId: txnId })
            }
            onEditLender={() =>
              navigateTo({ view: 'edit-lender', lenderId: lender.id })
            }
            onDeleteLender={() => handleDeleteLender(lender.id)}
          />
        );
      }

      case 'add-lender':
        return (
          <AddEditLenderPage
            onSave={handleCreateLender}
            onCancel={() => navigateTo({ view: 'loans' })}
          />
        );

      case 'edit-lender': {
        const lender = lenders.find((l) => l.id === route.lenderId);
        if (!lender) {
          return null;
        }
        return (
          <AddEditLenderPage
            initialLender={lender}
            onSave={(data) => handleUpdateLender(lender.id, data)}
            onCancel={() =>
              navigateTo({ view: 'lender-detail', lenderId: lender.id })
            }
          />
        );
      }

      case 'add-transaction':
        return (
          <TransactionFormPage
            defaultLenderId={route.lenderId}
            defaultType={route.defaultType}
            lenders={lenders}
            transactions={transactions}
            currency={settings.currency}
            onSave={handleCreateTransaction}
            onCancel={() => {
              if (route.lenderId) {
                navigateTo({ view: 'lender-detail', lenderId: route.lenderId });
              } else {
                navigateTo({ view: 'history' });
              }
            }}
          />
        );

      case 'edit-transaction': {
        const txn = transactions.find((t) => t.id === route.transactionId);
        if (!txn) {
          return (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p>Transaction not found.</p>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ marginTop: 16 }}
                onClick={() => navigateTo({ view: 'history' })}
              >
                Back to History
              </button>
            </div>
          );
        }
        return (
          <TransactionFormPage
            initialTransaction={txn}
            lenders={lenders}
            transactions={transactions}
            currency={settings.currency}
            onSave={(data) => handleUpdateTransaction(txn.id, data)}
            onDelete={() => handleDeleteTransaction(txn.id)}
            onCancel={() => {
              navigateTo({ view: 'lender-detail', lenderId: txn.lenderId });
            }}
          />
        );
      }

      case 'history':
        return (
          <HistoryPage
            transactions={transactions}
            lenders={lenders}
            currency={settings.currency}
            onEditTransaction={(txnId) =>
              navigateTo({ view: 'edit-transaction', transactionId: txnId })
            }
            onAddTransaction={() =>
              navigateTo({ view: 'add-transaction', defaultType: 'borrowed' })
            }
          />
        );

      case 'settings':
        return (
          <SettingsPage
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onClearAllData={handleClearAllData}
            onDataReload={handleDataReload}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      {/* Top iOS Header */}
      {renderHeader()}

      {/* Main Screen Content */}
      <main className="app-content">{renderContent()}</main>

      {/* Bottom Fixed Navigation */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
    </div>
  );
}

export default App;
