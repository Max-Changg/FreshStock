import { useState, useCallback } from 'react';
import { useInventoryStore } from '@/features/inventory/store/inventoryStore';

export interface ScannedItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  date_added: string;
  selected: boolean;
}

export interface UseReceiptScanner {
  isOpen: boolean;
  isScanning: boolean;
  error: string | null;
  scanId: string | null;
  scannedItems: ScannedItem[];
  /** true when scan completed successfully but returned 0 parseable items */
  noItemsFound: boolean;
  openScanner: () => void;
  closeScanner: () => void;
  scanFile: (file: File) => Promise<void>;
  updateItem: (id: string, updates: Partial<ScannedItem>) => void;
  toggleItem: (id: string) => void;
  toggleAll: (selected: boolean) => void;
  confirmAndAdd: () => Promise<void>;
}

export function useReceiptScanner(): UseReceiptScanner {
  const addItem = useInventoryStore((s) => s.addItem);

  const [isOpen, setIsOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noItemsFound, setNoItemsFound] = useState(false);
  const [scanId, setScanId] = useState<string | null>(null);
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);

  const openScanner = useCallback(() => {
    setIsOpen(true);
    setIsScanning(false);
    setError(null);
    setNoItemsFound(false);
    setScanId(null);
    setScannedItems([]);
  }, []);

  const closeScanner = useCallback(() => {
    setIsOpen(false);
  }, []);

  const scanFile = useCallback(async (file: File) => {
    setIsScanning(true);
    setError(null);
    setNoItemsFound(false);
    setScanId(null);
    setScannedItems([]);

    const formData = new FormData();
    formData.append('receipt', file);

    try {
      const res = await fetch('/api/scan-receipt', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.details ?? data.error ?? 'OCR failed');
      }

      if (!data.items || data.items.length === 0) {
        setNoItemsFound(true);
        return;
      }

      setScanId(data.scanId);
      setScannedItems(
        (data.items as Omit<ScannedItem, 'selected'>[]).map((item) => ({
          ...item,
          selected: true,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsScanning(false);
    }
  }, []);

  const updateItem = useCallback((id: string, updates: Partial<ScannedItem>) => {
    setScannedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  }, []);

  const toggleItem = useCallback((id: string) => {
    setScannedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  }, []);

  const toggleAll = useCallback((selected: boolean) => {
    setScannedItems((prev) => prev.map((item) => ({ ...item, selected })));
  }, []);

  const confirmAndAdd = useCallback(async () => {
    const toAdd = scannedItems.filter((item) => item.selected);

    for (const item of toAdd) {
      addItem({
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        dateAdded: item.date_added,
        expiryDate: '',
      });
    }

    if (scanId) {
      try {
        await fetch('/api/scan-receipt/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scanId, items: toAdd }),
        });
      } catch {
        // best-effort
      }
    }

    setIsOpen(false);
  }, [scannedItems, scanId, addItem]);

  return {
    isOpen,
    isScanning,
    error,
    noItemsFound,
    scanId,
    scannedItems,
    openScanner,
    closeScanner,
    scanFile,
    updateItem,
    toggleItem,
    toggleAll,
    confirmAndAdd,
  };
}
