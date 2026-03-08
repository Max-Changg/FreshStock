import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSupplierSearch } from './useSupplierSearch';

describe('when searching suppliers with no filters applied', () => {
  it('returns all 6 suppliers by default', () => {
    const { result } = renderHook(() => useSupplierSearch());
    expect(result.current.filtered).toHaveLength(6);
  });
});

describe('when filtering suppliers by text query', () => {
  it('matches suppliers by name', () => {
    const { result } = renderHook(() => useSupplierSearch());

    act(() => result.current.setQuery('Herb Haven'));

    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0].name).toBe('Herb Haven');
  });

  it('matches suppliers by product name', () => {
    const { result } = renderHook(() => useSupplierSearch());

    act(() => result.current.setQuery('eggs'));

    const names = result.current.filtered.map((s) => s.name);
    expect(names).toContain('Happy Hens Co-op');
  });

  it('is case-insensitive', () => {
    const { result } = renderHook(() => useSupplierSearch());

    act(() => result.current.setQuery('COFFEE'));

    expect(result.current.filtered.length).toBeGreaterThan(0);
  });

  it('returns an empty array when no suppliers match the query', () => {
    const { result } = renderHook(() => useSupplierSearch());

    act(() => result.current.setQuery('xyzzy-nonexistent'));

    expect(result.current.filtered).toHaveLength(0);
  });

  it('returns all suppliers when the query is cleared', () => {
    const { result } = renderHook(() => useSupplierSearch());

    act(() => result.current.setQuery('Herb Haven'));
    act(() => result.current.setQuery(''));

    expect(result.current.filtered).toHaveLength(6);
  });
});

describe('when filtering suppliers by category', () => {
  it('returns only Produce suppliers', () => {
    const { result } = renderHook(() => useSupplierSearch());

    act(() => result.current.setCategory('Produce'));

    expect(result.current.filtered.every((s) => s.category === 'Produce')).toBe(true);
  });

  it('returns only Dairy suppliers', () => {
    const { result } = renderHook(() => useSupplierSearch());

    act(() => result.current.setCategory('Dairy'));

    expect(result.current.filtered.every((s) => s.category === 'Dairy')).toBe(true);
    expect(result.current.filtered.length).toBeGreaterThan(0);
  });

  it('returns no results for a category with no matches', () => {
    const { result } = renderHook(() => useSupplierSearch());

    act(() => result.current.setCategory('Oils'));

    expect(result.current.filtered).toHaveLength(0);
  });
});

describe('when filtering suppliers by certification', () => {
  it('returns only suppliers with the Organic certification', () => {
    const { result } = renderHook(() => useSupplierSearch());

    act(() => result.current.setCert('Organic'));

    expect(result.current.filtered.every((s) => s.certs.includes('Organic'))).toBe(true);
    expect(result.current.filtered.length).toBeGreaterThan(0);
  });

  it('returns only suppliers with the Free Range certification', () => {
    const { result } = renderHook(() => useSupplierSearch());

    act(() => result.current.setCert('Free Range'));

    expect(result.current.filtered.every((s) => s.certs.includes('Free Range'))).toBe(true);
  });
});

describe('when filtering suppliers by distance', () => {
  it('returns only suppliers within 5 miles', () => {
    const { result } = renderHook(() => useSupplierSearch());

    act(() => result.current.setDistance('Under 5 miles'));

    expect(result.current.filtered.every((s) => s.miles <= 5)).toBe(true);
    expect(result.current.filtered.length).toBeGreaterThan(0);
  });

  it('excludes suppliers beyond the distance limit', () => {
    const { result } = renderHook(() => useSupplierSearch());

    act(() => result.current.setDistance('Under 5 miles'));

    // Fair Trade Coffee Co. is 12 miles — should not appear
    const names = result.current.filtered.map((s) => s.name);
    expect(names).not.toContain('Fair Trade Coffee Co.');
  });
});

describe('when combining multiple filters', () => {
  it('applies category and cert filters together', () => {
    const { result } = renderHook(() => useSupplierSearch());

    act(() => {
      result.current.setCategory('Produce');
      result.current.setCert('Organic');
    });

    expect(
      result.current.filtered.every(
        (s) => s.category === 'Produce' && s.certs.includes('Organic'),
      ),
    ).toBe(true);
  });
});
