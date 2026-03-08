import { useClockStore } from '@/shared/store/clockStore';

export function useClock() {
  const { simulatedDate, setSimulatedDate, getToday } = useClockStore();
  const isSimulating = simulatedDate !== null;
  const today = getToday();
  const resetToToday = () => setSimulatedDate(null);
  return { today, simulatedDate, isSimulating, setSimulatedDate, resetToToday };
}
