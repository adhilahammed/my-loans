import React from 'react';
import { Wallet, History, Settings } from 'lucide-react';
import type { ActiveTab } from '../types';

interface BottomNavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <nav className="bottom-nav" aria-label="Main Navigation">
      <button
        type="button"
        className={`nav-item ${activeTab === 'loans' ? 'active' : ''}`}
        onClick={() => onTabChange('loans')}
        aria-label="Loans"
      >
        <div className="nav-icon-container">
          <Wallet size={22} strokeWidth={activeTab === 'loans' ? 2.3 : 1.8} />
        </div>
        <span className="nav-label">Loans</span>
      </button>

      <button
        type="button"
        className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
        onClick={() => onTabChange('history')}
        aria-label="History"
      >
        <div className="nav-icon-container">
          <History size={22} strokeWidth={activeTab === 'history' ? 2.3 : 1.8} />
        </div>
        <span className="nav-label">History</span>
      </button>

      <button
        type="button"
        className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
        onClick={() => onTabChange('settings')}
        aria-label="Settings"
      >
        <div className="nav-icon-container">
          <Settings size={22} strokeWidth={activeTab === 'settings' ? 2.3 : 1.8} />
        </div>
        <span className="nav-label">Settings</span>
      </button>
    </nav>
  );
};
