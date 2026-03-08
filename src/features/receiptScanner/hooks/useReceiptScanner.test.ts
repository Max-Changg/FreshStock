import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useReceiptScanner } from './useReceiptScanner';

// Mock the inventory store so we can track addItem calls
const mockAddItem = vi.fn();
vi.mock('@/features/inventory/store/inventoryStore', () => ({
  useInventoryStore: (selector: (s: { addItem: typeof mockAddItem }) => unknown) =>
    selector({ addItem: mockAddItem }),
}));

// Mock global fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

function makeFile(name = 'receipt.jpg'): File {
  return new File(['content'], name, { type: 'image/jpeg' });
}

function makeScannedItem(id: string, overrides = {}) {
  return {
    id,
    name: 'Milk',
    category: 'Dairy',
    quantity: 2,
    unit: 'L',
    date_added: '2025-06-10',
    ...overrides,
  };
}

beforeEach(() => {
  mockAddItem.mockClear();
  mockFetch.mockReset();
});

describe('when opening and closing the scanner', () => {
  it('starts with isOpen false', () => {
    const { result } = renderHook(() => useReceiptScanner());
    expect(result.current.isOpen).toBe(false);
  });

  it('sets isOpen to true after openScanner is called', () => {
    const { result } = renderHook(() => useReceiptScanner());

    act(() => result.current.openScanner());

    expect(result.current.isOpen).toBe(true);
  });

  it('resets error and scannedItems when reopening', () => {
    const { result } = renderHook(() => useReceiptScanner());

    // Manually put it in a state, then reopen
    act(() => result.current.openScanner());
    act(() => result.current.closeScanner());
    act(() => result.current.openScanner());

    expect(result.current.error).toBeNull();
    expect(result.current.scannedItems).toHaveLength(0);
  });

  it('sets isOpen to false after closeScanner is called', () => {
    const { result } = renderHook(() => useReceiptScanner());

    act(() => result.current.openScanner());
    act(() => result.current.closeScanner());

    expect(result.current.isOpen).toBe(false);
  });
});

describe('when scanning a file successfully', () => {
  it('sets scannedItems from the API response with selected true', async () => {
    const apiItems = [makeScannedItem('i1'), makeScannedItem('i2', { name: 'Eggs' })];
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ scanId: 'scan-abc', items: apiItems }),
    });

    const { result } = renderHook(() => useReceiptScanner());

    await act(async () => {
      await result.current.scanFile(makeFile());
    });

    expect(result.current.scannedItems).toHaveLength(2);
    expect(result.current.scannedItems.every((i) => i.selected)).toBe(true);
    expect(result.current.scanId).toBe('scan-abc');
    expect(result.current.isScanning).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets noItemsFound when the API returns an empty items array', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ scanId: null, items: [] }),
    });

    const { result } = renderHook(() => useReceiptScanner());

    await act(async () => {
      await result.current.scanFile(makeFile());
    });

    expect(result.current.noItemsFound).toBe(true);
    expect(result.current.scannedItems).toHaveLength(0);
    expect(result.current.isScanning).toBe(false);
  });
});

describe('when the scan API call fails', () => {
  it('sets the error message from the API error field', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'OCR service unavailable' }),
    });

    const { result } = renderHook(() => useReceiptScanner());

    await act(async () => {
      await result.current.scanFile(makeFile());
    });

    expect(result.current.error).toBe('OCR service unavailable');
    expect(result.current.isScanning).toBe(false);
  });

  it('sets the error message from the details field when present', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'failed', details: 'Image too large' }),
    });

    const { result } = renderHook(() => useReceiptScanner());

    await act(async () => {
      await result.current.scanFile(makeFile());
    });

    expect(result.current.error).toBe('Image too large');
  });

  it('sets error when fetch rejects entirely (network failure)', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useReceiptScanner());

    await act(async () => {
      await result.current.scanFile(makeFile());
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.isScanning).toBe(false);
  });
});

describe('when editing scanned items in the review step', () => {
  async function withItems(hook: ReturnType<typeof renderHook<ReturnType<typeof useReceiptScanner>, unknown>>) {
    const apiItems = [makeScannedItem('i1'), makeScannedItem('i2', { name: 'Eggs' })];
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ scanId: 'scan-xyz', items: apiItems }),
    });

    await act(async () => {
      await hook.result.current.scanFile(makeFile());
    });
  }

  it('toggleItem flips the selected state of a single item', async () => {
    const hook = renderHook(() => useReceiptScanner());
    await withItems(hook);

    act(() => hook.result.current.toggleItem('i1'));

    const item = hook.result.current.scannedItems.find((i) => i.id === 'i1');
    expect(item?.selected).toBe(false);
  });

  it('toggleAll sets all items to the specified selected value', async () => {
    const hook = renderHook(() => useReceiptScanner());
    await withItems(hook);

    act(() => hook.result.current.toggleAll(false));

    expect(hook.result.current.scannedItems.every((i) => !i.selected)).toBe(true);
  });

  it('updateItem applies partial updates to the matching item', async () => {
    const hook = renderHook(() => useReceiptScanner());
    await withItems(hook);

    act(() => hook.result.current.updateItem('i1', { name: 'Oat Milk', quantity: 3 }));

    const item = hook.result.current.scannedItems.find((i) => i.id === 'i1');
    expect(item?.name).toBe('Oat Milk');
    expect(item?.quantity).toBe(3);
  });
});

describe('when confirming and adding scanned items', () => {
  it('calls addItem for each selected item', async () => {
    const apiItems = [makeScannedItem('i1'), makeScannedItem('i2', { name: 'Eggs' })];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ scanId: 'scan-1', items: apiItems }),
    });
    // Second fetch for /confirm
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    const { result } = renderHook(() => useReceiptScanner());

    await act(async () => {
      await result.current.scanFile(makeFile());
    });

    await act(async () => {
      await result.current.confirmAndAdd();
    });

    expect(mockAddItem).toHaveBeenCalledTimes(2);
    expect(mockAddItem).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Milk', category: 'Dairy' }),
    );
  });

  it('skips deselected items', async () => {
    const apiItems = [makeScannedItem('i1'), makeScannedItem('i2', { name: 'Eggs' })];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ scanId: 'scan-1', items: apiItems }),
    });
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    const { result } = renderHook(() => useReceiptScanner());

    await act(async () => {
      await result.current.scanFile(makeFile());
    });

    act(() => result.current.toggleItem('i1')); // deselect first item

    await act(async () => {
      await result.current.confirmAndAdd();
    });

    expect(mockAddItem).toHaveBeenCalledTimes(1);
    expect(mockAddItem.mock.calls[0][0].name).toBe('Eggs');
  });

  it('closes the modal after confirming', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ scanId: null, items: [makeScannedItem('i1')] }),
    });
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    const { result } = renderHook(() => useReceiptScanner());
    act(() => result.current.openScanner());

    await act(async () => {
      await result.current.scanFile(makeFile());
    });

    await act(async () => {
      await result.current.confirmAndAdd();
    });

    await waitFor(() => expect(result.current.isOpen).toBe(false));
  });
});
