import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useClockStore } from './clockStore';

// Reset store state between tests
beforeEach(() => {
  useClockStore.setState({ simulatedDate: null });
});

describe('when the clock is in real-time mode', () => {
  it('getToday returns a string in YYYY-MM-DD format', () => {
    const today = useClockStore.getState().getToday();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('simulatedDate is null by default', () => {
    expect(useClockStore.getState().simulatedDate).toBeNull();
  });
});

describe('when a simulated date is set', () => {
  it('getToday returns the simulated date string', () => {
    useClockStore.getState().setSimulatedDate('2025-03-15');
    expect(useClockStore.getState().getToday()).toBe('2025-03-15');
  });

  it('simulatedDate reflects the value that was set', () => {
    useClockStore.getState().setSimulatedDate('2025-12-25');
    expect(useClockStore.getState().simulatedDate).toBe('2025-12-25');
  });

  it('returns real today after simulation is cleared', () => {
    useClockStore.getState().setSimulatedDate('2025-03-15');
    useClockStore.getState().setSimulatedDate(null);
    const today = useClockStore.getState().getToday();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // Simulated date is gone
    expect(useClockStore.getState().simulatedDate).toBeNull();
  });

  it('returns the local date — not UTC — when no simulation is active', () => {
    // Mock Date so we control the local timezone result
    const mockDate = new Date(2025, 5, 10, 23, 30); // June 10 local time
    vi.setSystemTime(mockDate);
    const today = useClockStore.getState().getToday();
    expect(today).toBe('2025-06-10');
    vi.useRealTimers();
  });
});
