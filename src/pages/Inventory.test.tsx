import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Inventory } from './Inventory';

// ── Stub heavy sub-components ──

vi.mock('@/features/inventory/hooks/useExpiry', () => ({
  useExpiryStats: () => ({ total: 5, expiringSoon: 1, expired: 0 }),
}));

vi.mock('@/features/inventory/components/InventoryTable', () => ({
  InventoryTable: ({ searchQuery }: { searchQuery: string }) => (
    <div data-testid="inventory-table" data-query={searchQuery} />
  ),
}));

vi.mock('@/features/receiptScanner/hooks/useReceiptScanner', () => ({
  useReceiptScanner: () => ({
    isOpen: false,
    isScanning: false,
    error: null,
    noItemsFound: false,
    scanId: null,
    scannedItems: [],
    openScanner: vi.fn(),
    closeScanner: vi.fn(),
    scanFile: vi.fn(),
    updateItem: vi.fn(),
    toggleItem: vi.fn(),
    toggleAll: vi.fn(),
    confirmAndAdd: vi.fn(),
  }),
}));

vi.mock('@/features/receiptScanner/components/ReceiptScannerModal', () => ({
  ReceiptScannerModal: () => null,
}));

describe('when the Inventory page renders', () => {
  it('shows the Inventory heading', () => {
    render(<Inventory />);
    expect(screen.getByRole('heading', { name: /inventory/i })).toBeInTheDocument();
  });

  it('renders the stats bar with the correct counts', () => {
    render(<Inventory />);
    expect(screen.getByText('5')).toBeInTheDocument(); // total
    expect(screen.getByText('Total Items')).toBeInTheDocument();
  });

  it('renders the inventory table', () => {
    render(<Inventory />);
    expect(screen.getByTestId('inventory-table')).toBeInTheDocument();
  });

  it('renders the search input', () => {
    render(<Inventory />);
    expect(screen.getByPlaceholderText(/search by item name/i)).toBeInTheDocument();
  });

  it('renders the Scan Receipt button', () => {
    render(<Inventory />);
    expect(screen.getByRole('button', { name: /scan receipt/i })).toBeInTheDocument();
  });

  it('renders the Usage Update toggle', () => {
    render(<Inventory />);
    expect(screen.getByRole('button', { name: /usage update/i })).toBeInTheDocument();
  });
});

describe('when searching for items', () => {
  it('passes the typed query to the inventory table', async () => {
    render(<Inventory />);

    await userEvent.type(screen.getByPlaceholderText(/search by item name/i), 'Milk');

    expect(screen.getByTestId('inventory-table')).toHaveAttribute('data-query', 'Milk');
  });
});

describe('when toggling usage update mode', () => {
  it('shows "Recording Usage" text when the toggle is activated', async () => {
    render(<Inventory />);

    const toggle = screen.getByRole('button', { name: /usage update/i });
    await userEvent.click(toggle);

    expect(screen.getByText(/recording usage/i)).toBeInTheDocument();
  });

  it('shows a helper message while usage mode is active', async () => {
    render(<Inventory />);

    await userEvent.click(screen.getByRole('button', { name: /usage update/i }));

    expect(screen.getByText(/usage update is/i)).toBeInTheDocument();
  });

  it('returns to "Usage Update" label when toggled off again', async () => {
    render(<Inventory />);

    const toggle = screen.getByRole('button', { name: /usage update/i });
    await userEvent.click(toggle); // on
    await userEvent.click(screen.getByRole('button', { name: /recording usage/i })); // off

    expect(screen.getByRole('button', { name: /usage update/i })).toBeInTheDocument();
  });
});
