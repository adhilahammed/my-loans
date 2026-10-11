import React from 'react';
import { ChevronLeft } from 'lucide-react';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  backLabel?: string;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onBack,
  backLabel = 'Back',
  rightAction,
}) => {
  return (
    <header className="app-header">
      <div style={{ minWidth: 64, display: 'flex', alignItems: 'center' }}>
        {onBack ? (
          <button
            type="button"
            className="header-btn"
            onClick={onBack}
            aria-label={backLabel}
          >
            <ChevronLeft size={22} strokeWidth={2.5} />
            <span>{backLabel}</span>
          </button>
        ) : null}
      </div>

      <h1 className="header-title">{title}</h1>

      <div
        style={{
          minWidth: 64,
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
        }}
      >
        {rightAction}
      </div>
    </header>
  );
};
