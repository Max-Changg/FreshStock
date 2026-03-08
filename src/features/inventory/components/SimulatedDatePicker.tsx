import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';
import { useClock } from '@/shared/hooks/useClock';

function addDays(dateStr: string, delta: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + delta);
  return d.toISOString().split('T')[0];
}

function formatShort(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function SimulatedDatePicker() {
  const { today, simulatedDate, isSimulating, setSimulatedDate, resetToToday } = useClock();

  if (!isSimulating) {
    return (
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 text-xs text-forest/50">
          <Calendar className="h-3.5 w-3.5" />
          Today: {formatShort(today)}
        </span>
        <button
          onClick={() => setSimulatedDate(today)}
          className="rounded-md border border-forest/20 bg-white px-2.5 py-1.5 text-xs font-medium text-forest/60 transition-colors hover:border-forest/40 hover:bg-forest/5 hover:text-forest"
        >
          Simulate date ▾
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
        <Clock className="h-3.5 w-3.5" />
        Simulating:
      </span>
      <button
        onClick={() => setSimulatedDate(addDays(simulatedDate!, -1))}
        className="rounded border border-amber-200 bg-amber-50 p-1 text-amber-600 transition-colors hover:bg-amber-100"
        aria-label="Go back 1 day"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>
      <input
        type="date"
        value={simulatedDate!}
        onChange={(e) => e.target.value && setSimulatedDate(e.target.value)}
        className="rounded border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 focus:outline-none focus:ring-1 focus:ring-amber-400"
      />
      <button
        onClick={() => setSimulatedDate(addDays(simulatedDate!, 1))}
        className="rounded border border-amber-200 bg-amber-50 p-1 text-amber-600 transition-colors hover:bg-amber-100"
        aria-label="Go forward 1 day"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={resetToToday}
        className="rounded border border-amber-200 bg-white px-2.5 py-1 text-xs font-medium text-amber-600 transition-colors hover:bg-amber-50"
      >
        Reset
      </button>
    </div>
  );
}

export function SimulationBanner() {
  const { isSimulating, simulatedDate } = useClock();
  if (!isSimulating) return null;

  const formatted = new Date(simulatedDate! + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="flex items-center justify-center gap-2 bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs font-medium text-amber-700">
      <span>⚠</span>
      <span>Simulating date: {formatted} — inventory status reflects this date</span>
    </div>
  );
}
