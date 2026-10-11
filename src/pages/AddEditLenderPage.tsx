import React, { useState } from 'react';
import type { Lender, LenderType } from '../types';
import { SegmentedControl } from '../components/SegmentedControl';
import { User, Landmark, HelpCircle, Check, AlertCircle } from 'lucide-react';

interface AddEditLenderPageProps {
  initialLender?: Lender;
  onSave: (lenderData: { name: string; type: LenderType; notes?: string }) => void;
  onCancel: () => void;
}

export const AddEditLenderPage: React.FC<AddEditLenderPageProps> = ({
  initialLender,
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState(initialLender?.name || '');
  const [type, setType] = useState<LenderType>(initialLender?.type || 'person');
  const [notes, setNotes] = useState(initialLender?.notes || '');
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(initialLender);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Lender name is required.');
      return;
    }

    onSave({
      name: trimmed,
      type,
      notes: notes.trim() || undefined,
    });
  };

  const typeOptions: { label: string; value: LenderType; icon: React.ReactNode }[] = [
    { label: 'Person', value: 'person', icon: <User size={15} /> },
    { label: 'Bank', value: 'bank', icon: <Landmark size={15} /> },
    { label: 'Other', value: 'other', icon: <HelpCircle size={15} /> },
  ];

  return (
    <div className="add-edit-lender-page">
      <div className="page-intro">
        <h1 className="page-title">{isEditing ? 'Edit Lender' : 'Add New Lender'}</h1>
        <p className="page-subtitle">
          {isEditing
            ? 'Update lender contact and loan details.'
            : 'Enter the person or institution details.'}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="ios-card">
          {/* Lender Type Toggle */}
          <div className="form-group">
            <label className="form-label">Lender Type</label>
            <SegmentedControl<LenderType>
              options={typeOptions}
              value={type}
              onChange={(val) => setType(val)}
              ariaLabel="Lender Type"
            />
          </div>

          {/* Name Field */}
          <div className="form-group">
            <label htmlFor="lender-name-input" className="form-label">
              Lender Name <span style={{ color: 'var(--repay-color)' }}>*</span>
            </label>
            <input
              id="lender-name-input"
              type="text"
              className="form-input"
              placeholder="e.g. Rahul, HDFC, Mom"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              autoFocus
              autoCapitalize="words"
              autoComplete="off"
            />
            {error && (
              <div className="form-error">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Notes Field */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="lender-notes-input" className="form-label">
              Notes (Optional)
            </label>
            <textarea
              id="lender-notes-input"
              className="form-textarea"
              placeholder="Add details, contact info, loan purpose, or repayment terms"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
          <button type="submit" className="btn btn-primary">
            <Check size={18} strokeWidth={2.5} />
            <span>{isEditing ? 'Save Changes' : 'Create Lender'}</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
