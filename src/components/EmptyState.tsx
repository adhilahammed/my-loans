import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="empty-state">
      <div className="empty-icon-box">{icon}</div>
      <h3 className="empty-title">{title}</h3>
      <p className="empty-desc">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onAction}
          style={{ width: 'auto', padding: '10px 20px' }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
