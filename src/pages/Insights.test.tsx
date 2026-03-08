import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ── Stub out all dependencies that need network / DB access ──

vi.mock('@/features/inventory/hooks/useInventory', () => ({
  useInventoryItems: () => [],
}));

vi.mock('@/features/insights/hooks/useUsageStats', () => ({
  useUsageStats: () => ({
    itemUsageRates: [],
    weeklyTrends: [],
    monthlyWaste: [],
    isLoading: false,
    error: null,
  }),
}));

vi.mock('@/features/insights/hooks/useWasteInsights', () => ({
  useWasteInsights: () => ({
    rows: [],
    isLoading: false,
    error: null,
  }),
}));

vi.mock('@/features/insights/components/RunningOutCard', () => ({
  RunningOutCard: () => <div data-testid="running-out-card" />,
}));

vi.mock('@/features/insights/components/UsageTrendsList', () => ({
  UsageTrendsList: () => <div data-testid="usage-trends-list" />,
}));

vi.mock('@/features/insights/components/FoodWasteList', () => ({
  FoodWasteList: () => <div data-testid="food-waste-list" />,
}));

const { mockClearAllUsageRecords } = vi.hoisted(() => ({
  mockClearAllUsageRecords: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/db', () => ({
  clearAllUsageRecords: mockClearAllUsageRecords,
}));

import { Insights } from './Insights';

beforeEach(() => {
  mockClearAllUsageRecords.mockClear();
});

describe('when the Insights page renders', () => {
  it('shows the Smart Insights heading', () => {
    render(<Insights />);
    expect(screen.getByRole('heading', { name: /smart insights/i })).toBeInTheDocument();
  });

  it('renders the items running out soon section', () => {
    render(<Insights />);
    expect(screen.getByText(/items running out soon/i)).toBeInTheDocument();
  });

  it('renders the items almost expired placeholder section', () => {
    render(<Insights />);
    expect(screen.getByText(/items almost expired/i)).toBeInTheDocument();
  });

  it('renders the UsageTrendsList component', () => {
    render(<Insights />);
    expect(screen.getByTestId('usage-trends-list')).toBeInTheDocument();
  });

  it('renders the FoodWasteList component', () => {
    render(<Insights />);
    expect(screen.getByTestId('food-waste-list')).toBeInTheDocument();
  });

  it('renders the Reset Usage button', () => {
    render(<Insights />);
    expect(screen.getByRole('button', { name: /reset usage/i })).toBeInTheDocument();
  });

  it('shows the RunningOutCard when stats are loaded without errors', () => {
    render(<Insights />);
    expect(screen.getByTestId('running-out-card')).toBeInTheDocument();
  });
});

describe('when the Reset Usage button is clicked', () => {
  it('prompts the user for confirmation before clearing', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<Insights />);

    await userEvent.click(screen.getByRole('button', { name: /reset usage/i }));

    expect(confirmSpy).toHaveBeenCalledOnce();
    expect(mockClearAllUsageRecords).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('calls clearAllUsageRecords when the user confirms', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<Insights />);

    await userEvent.click(screen.getByRole('button', { name: /reset usage/i }));

    await waitFor(() => expect(mockClearAllUsageRecords).toHaveBeenCalledOnce());
    vi.restoreAllMocks();
  });

  it('does not call clearAllUsageRecords when the user cancels the confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<Insights />);

    await userEvent.click(screen.getByRole('button', { name: /reset usage/i }));

    expect(mockClearAllUsageRecords).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });
});
