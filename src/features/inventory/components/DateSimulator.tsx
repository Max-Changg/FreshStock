import { useRef } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { addDays, subDays } from 'date-fns';
import { useClock } from '@/shared/hooks/useClock';
import { parseLocalDate, formatDate } from '@/shared/utils/formatDate';

export function DateSimulator() {
  const { today, isSimulating, setSimulatedDate, resetToToday } = useClock();
  const inputRef = useRef<HTMLInputElement>(null);

  function shift(days: number) {
    const next = days > 0
      ? addDays(parseLocalDate(today), days)
      : subDays(parseLocalDate(today), Math.abs(days));
    const y = next.getFullYear();
    const m = String(next.getMonth() + 1).padStart(2, '0');
    const d = String(next.getDate()).padStart(2, '0');
    setSimulatedDate(`${y}-${m}-${d}`);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.value) setSimulatedDate(e.target.value);
  }

  return (
    <div className="flex items-center gap-2.5 select-none">
      <span className="text-xs text-forest/50 font-medium whitespace-nowrap">Today's date:</span>

      <div className={`flex items-center gap-0.5 rounded-lg border bg-white px-1 py-1 transition-colors ${
        isSimulating ? 'border-amber/40 ring-1 ring-amber/20' : 'border-forest/15'
      }`}>
        <button
          onClick={() => shift(-1)}
          className="rounded p-1 text-forest/40 hover:bg-forest/8 hover:text-forest transition-colors"
          aria-label="Previous day"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>

        {/* Date display — clicking opens native picker */}
        <div className="relative mx-1">
          <span className={`text-sm font-semibold whitespace-nowrap pointer-events-none ${
            isSimulating ? 'text-amber' : 'text-forest'
          }`}>
            {formatDate(today)}
          </span>
          {/* Native input is transparent and sits exactly over the label */}
          <input
            ref={inputRef}
            type="date"
            value={today}
            onChange={handleInputChange}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            aria-label="Pick a date"
          />
        </div>

        <button
          onClick={() => shift(1)}
          className="rounded p-1 text-forest/40 hover:bg-forest/8 hover:text-forest transition-colors"
          aria-label="Next day"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {isSimulating && (
        <button
          onClick={resetToToday}
          title="Reset to today"
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-forest/40 hover:text-forest hover:bg-forest/8 transition-colors"
        >
          <RotateCcw className="h-3 w-3" />
          reset
        </button>
      )}
    </div>
  );
}
