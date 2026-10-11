import React, { useState, useRef } from 'react';
import type { AppSettings } from '../types';
import { SUPPORTED_CURRENCIES } from '../utils/currency';
import { exportData, importData } from '../utils/storage';
import { ConfirmDialog } from '../components/ConfirmDialog';
import {
  Coins,
  Trash2,
  Download,
  Upload,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Share2,
} from 'lucide-react';

interface SettingsPageProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onClearAllData: () => void;
  onDataReload: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onUpdateSettings,
  onClearAllData,
  onDataReload,
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdateSettings({ ...settings, currency: e.target.value });
  };

  const handleExport = () => {
    try {
      const json = exportData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my-loans-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to export data.');
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importData(content);
      if (res.success) {
        setImportStatus({
          success: true,
          message: `Successfully restored ${res.lendersCount} lenders and ${res.transactionsCount} transactions.`,
        });
        onDataReload();
      } else {
        setImportStatus({
          success: false,
          message: res.error || 'Failed to import backup.',
        });
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  return (
    <div className="settings-page">
      <div className="page-intro">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Preferences and local data management</p>
      </div>

      {/* Currency Selection */}
      <div className="settings-group">
        <div className="settings-group-title">Preferences</div>
        <div className="settings-card">
          <div className="settings-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Coins size={20} color="var(--text-secondary)" />
              <span className="settings-label">Currency</span>
            </div>
            <select
              className="form-select"
              value={settings.currency}
              onChange={handleCurrencyChange}
              style={{
                width: 'auto',
                minWidth: 150,
                padding: '8px 12px',
                fontSize: 15,
                borderRadius: 10,
              }}
            >
              {SUPPORTED_CURRENCIES.map((cur) => (
                <option key={cur.code} value={cur.code}>
                  {cur.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Data Backup & Restore */}
      <div className="settings-group">
        <div className="settings-group-title">Backup & Restore</div>
        <div className="settings-card">
          <div className="settings-row" onClick={handleExport} style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Download size={20} color="var(--accent-blue)" />
              <div>
                <div className="settings-label">Export Data Backup</div>
                <div className="settings-desc">Download all records as a JSON file</div>
              </div>
            </div>
          </div>

          <div
            className="settings-row"
            onClick={() => fileInputRef.current?.click()}
            style={{ cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Upload size={20} color="var(--accent-blue)" />
              <div>
                <div className="settings-label">Import Data Backup</div>
                <div className="settings-desc">Restore records from a previously exported JSON file</div>
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportFile}
              accept=".json,application/json"
              style={{ display: 'none' }}
            />
          </div>
        </div>

        {importStatus && (
          <div
            style={{
              marginTop: 10,
              padding: '10px 14px',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              backgroundColor: importStatus.success
                ? 'var(--borrow-bg)'
                : 'var(--repay-bg)',
              color: importStatus.success
                ? 'var(--borrow-color)'
                : 'var(--repay-color)',
            }}
          >
            {importStatus.success ? (
              <CheckCircle2 size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
            <span>{importStatus.message}</span>
          </div>
        )}
      </div>

      {/* Safari Add to Home Screen PWA Guide */}
      <div className="settings-group">
        <div className="settings-group-title">iPhone Home Screen (PWA)</div>
        <div className="settings-card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Smartphone size={20} color="var(--text-primary)" />
            <span style={{ fontSize: 15, fontWeight: 600 }}>Install as iPhone App</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
            For a full native app feel without Safari browser bars:
          </p>

          <div className="pwa-instruction-item">
            <span className="pwa-step-number">1</span>
            <div>
              Open this website in <strong>Safari</strong> on your iPhone.
            </div>
          </div>
          <div className="pwa-instruction-item">
            <span className="pwa-step-number">2</span>
            <div>
              Tap the <strong>Share</strong> button <Share2 size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /> at the bottom bar.
            </div>
          </div>
          <div className="pwa-instruction-item">
            <span className="pwa-step-number">3</span>
            <div>
              Scroll down and tap <strong>Add to Home Screen</strong>.
            </div>
          </div>
          <div className="pwa-instruction-item">
            <span className="pwa-step-number">4</span>
            <div>
              Tap <strong>Add</strong> in the top-right corner.
            </div>
          </div>
        </div>
      </div>

      {/* Privacy and Storage Info */}
      <div className="settings-group">
        <div className="settings-group-title">Data Storage & Privacy</div>
        <div className="settings-card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <ShieldCheck size={20} color="var(--borrow-color)" />
            <span style={{ fontSize: 15, fontWeight: 600 }}>100% Private & Device-Only</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            All your lenders and loan transactions are stored strictly in your device's browser
            (localStorage). No financial records are ever sent to a remote server or third party.
          </p>
          <p
            style={{
              fontSize: 12,
              color: 'var(--text-tertiary)',
              lineHeight: 1.4,
              marginTop: 8,
            }}
          >
            Tip: Clearing Safari website data will erase local records. Use the <strong>Export Backup</strong> feature to keep a personal copy.
          </p>
        </div>
      </div>

      {/* Clear All Data */}
      <div className="settings-group" style={{ marginBottom: 32 }}>
        <div className="settings-group-title">Danger Zone</div>
        <div className="settings-card">
          <div
            className="settings-row"
            onClick={() => setShowClearConfirm(true)}
            style={{ cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Trash2 size={20} color="#DC2626" />
              <span className="settings-label" style={{ color: '#DC2626' }}>
                Clear All Data
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Clear Data Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        title="Clear All Data?"
        message="This will permanently delete all lenders, borrowings, repayments, and settings stored in this browser. This cannot be undone."
        confirmLabel="Clear Everything"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={() => {
          setShowClearConfirm(false);
          onClearAllData();
        }}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  );
};
