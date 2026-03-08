import { useEffect, useRef, useState } from 'react';
import { CATEGORIES, UNITS, todayISO } from '../constants/inventoryConstants';
import type { RowKind } from '../types/inventory.types';

// ─── EditableCell ─────────────────────────────────────────────────────────────
// Defined as a standalone component so React never remounts it mid-edit.

export interface EditableCellProps {
  columnId: string;
  rowKind: RowKind;
  value: string;
  displayValue?: string;   // formatted value shown when not editing (defaults to value)
  pillClasses?: string;    // if set, wraps displayValue in a colored pill
  inputType?: 'text' | 'date' | 'number';
  options?: readonly string[];
  placeholder?: string;
  onSave: (value: string) => void;
}

/** Returns the default value for a given column — used when Delete resets a cell. */
function getColumnDefault(columnId: string): string {
  if (columnId === 'dateAdded') return todayISO();
  const defaults: Record<string, string> = {
    name: '',
    quantity: '0',
    expiryDate: '',
    category: CATEGORIES[0],
    unit: UNITS[0],
  };
  return defaults[columnId] ?? '';
}

export function EditableCell({
  columnId,
  rowKind,
  value,
  displayValue,
  pillClasses,
  inputType = 'text',
  options,
  placeholder,
  onSave,
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

  // Sync when the committed value changes externally (e.g. another cell saved)
  useEffect(() => {
    if (!isEditing) setDraft(value);
  }, [value, isEditing]);

  function open() {
    setDraft(value);
    setIsEditing(true);
  }

  function commit() {
    setIsEditing(false);
    onSave(draft);
  }

  function cancel() {
    setIsEditing(false);
    setDraft(value);
  }

  const sharedKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); commit(); }
    if (e.key === 'Escape') cancel();
  };

  if (isEditing) {
    if (options) {
      return (
        <select
          ref={selectRef}
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={sharedKeyDown}
          className="w-full rounded border border-forest/30 bg-white px-1.5 py-0.5 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-forest/50"
        >
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    }

    return (
      <input
        ref={inputRef}
        autoFocus
        type={inputType}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={sharedKeyDown}
        className="w-full min-w-0 rounded border border-forest/30 bg-white px-1.5 py-0.5 text-sm text-forest focus:outline-none focus:ring-1 focus:ring-forest/50"
      />
    );
  }

  const shown = displayValue ?? value;
  const isEmpty = rowKind === 'placeholder' || !value;

  /** Handle Delete/Backspace on the focused display span — resets to column default. */
  function handleDisplayKeyDown(e: React.KeyboardEvent<HTMLSpanElement>) {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      onSave(getColumnDefault(columnId));
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      open();
    }
  }

  // Expiry date pill display
  if (pillClasses && value) {
    return (
      <span
        tabIndex={0}
        onClick={(e) => { if (!e.shiftKey && !e.metaKey && !e.ctrlKey) open(); }}
        onKeyDown={handleDisplayKeyDown}
        className={`inline-block cursor-pointer rounded-md px-2 py-0.5 text-xs font-medium outline-none focus:ring-2 focus:ring-blue-400 ${pillClasses}`}
      >
        {shown}
      </span>
    );
  }

  return (
    <span
      tabIndex={0}
      onClick={(e) => { if (!e.shiftKey && !e.metaKey && !e.ctrlKey) open(); }}
      onKeyDown={handleDisplayKeyDown}
      className={`block cursor-pointer rounded px-1 py-0.5 text-sm leading-6 outline-none hover:bg-forest/5 focus:ring-2 focus:ring-blue-400 ${
        isEmpty ? 'italic text-forest/30' : 'text-forest'
      }`}
    >
      {shown || placeholder || '\u00A0'}
    </span>
  );
}
