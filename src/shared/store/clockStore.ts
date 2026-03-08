import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ClockStore {
  simulatedDate: string | null;
  setSimulatedDate: (date: string | null) => void;
  getToday: () => string;
}

/** Returns the current local date as YYYY-MM-DD, avoiding UTC offset issues. */
function localTodayISO(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const useClockStore = create<ClockStore>()(
  persist(
    (set, get) => ({
      simulatedDate: null,
      setSimulatedDate: (date) => set({ simulatedDate: date }),
      getToday: () => get().simulatedDate ?? localTodayISO(),
    }),
    {
      name: 'freshstock-clock',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ simulatedDate: state.simulatedDate }),
    }
  )
);
