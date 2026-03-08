import { useState, useMemo } from 'react';
import { SUPPLIERS, type Supplier, type SupplierCategory } from '../data/suppliers';

export type CertFilter = 'All' | 'Organic' | 'Fair Trade' | 'Local' | 'B-Corp' | 'Free Range';
export type DistanceFilter = 'Any' | 'Under 5 miles' | 'Under 10 miles' | 'Under 25 miles';
export type CategoryFilter = 'All' | SupplierCategory;

const DISTANCE_LIMITS: Record<DistanceFilter, number> = {
  Any: Infinity,
  'Under 5 miles': 5,
  'Under 10 miles': 10,
  'Under 25 miles': 25,
};

export function useSupplierSearch() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('All');
  const [cert, setCert] = useState<CertFilter>('All');
  const [distance, setDistance] = useState<DistanceFilter>('Any');

  const filtered = useMemo<Supplier[]>(() => {
    const q = query.trim().toLowerCase();
    const maxMiles = DISTANCE_LIMITS[distance];

    return SUPPLIERS.filter((s) => {
      if (q && !s.name.toLowerCase().includes(q) && !s.products.some((p) => p.toLowerCase().includes(q))) {
        return false;
      }
      if (category !== 'All' && s.category !== category) return false;
      if (cert !== 'All' && !s.certs.includes(cert)) return false;
      if (s.miles > maxMiles) return false;
      return true;
    });
  }, [query, category, cert, distance]);

  return { query, setQuery, category, setCategory, cert, setCert, distance, setDistance, filtered };
}
