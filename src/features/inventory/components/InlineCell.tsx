import { useEffect, useState } from 'react';
import { cn } from '@/shared/utils/cn';

const BASE =
  'w-full rounded border border-transparent bg-transparent px-1.5 py-1 text-sm text-forest focus:outline-none focus:border-forest/30 focus:bg-white transition-colors placeholder:text-forest/30';

export interface InlineCellProps {
  value: string;
  inputType?: 'text' | 'date' | 'number';
  options?: readonly string[];
  placeholder?: string;
  /** Extra classes applied to the input — used for expiry-date colour coding. */
  accentClasses?: string;
  onSave: (value: string) => void;
}

/**
 * Always-visible editable cell — mirrors the receipt-scanner row style.
 * Inputs save on blur / Enter; selects save immediately on change.
 */
export function InlineCell({
  value,
  inputType = 'text',
  options,
  placeholder,
  accentClasses,
  onSave,
}: InlineCellProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  function commit() {
    onSave(draft);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); commit(); }
    if (e.key === 'Escape') setDraft(value);
  }

  if (options) {
    return (
      <select
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          onSave(e.target.value);
        }}
        className={cn(BASE, 'cursor-pointer')}
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    );
  }

  return (
    <input
      type={inputType}
      value={draft}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={handleKeyDown}
      className={cn(BASE, accentClasses)}
    />
  );
}
