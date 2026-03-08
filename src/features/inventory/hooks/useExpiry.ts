import { useMemo } from 'react';
import { useInventoryItems } from './useInventory';
import { getExpiryStatus } from '../utils/expiry';
import { useClock } from '@/shared/hooks/useClock';
import type { ExpiryStatus } from '../types';

export function useExpiryStats(): {
  total: number;
  expiringSoon: number;
  expired: number;
} {
  const items = useInventoryItems();
  const { today } = useClock();

  return useMemo(() => {
    let expiringSoon = 0;
    let expired = 0;

    for (const item of items) {
      const status = getExpiryStatus(item.expiryDate, today);
      if (status === 'expiring') expiringSoon++;
      if (status === 'expired') expired++;
    }

    return {
      total: items.length,
      expiringSoon,
      expired,
    };
  }, [items, today]);
}

export function useItemExpiryStatus(expiryDate: string): ExpiryStatus {
  const { today } = useClock();
  return useMemo(() => getExpiryStatus(expiryDate, today), [expiryDate, today]);
}
