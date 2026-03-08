import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRowSelection } from './useRowSelection';

const IDS = ['a', 'b', 'c', 'd', 'e'];

function makeMouseEvent(overrides: Partial<MouseEvent> = {}): React.MouseEvent {
  return {
    shiftKey: false,
    metaKey: false,
    ctrlKey: false,
    ...overrides,
  } as unknown as React.MouseEvent;
}

describe('when selecting rows with plain clicks', () => {
  it('selects only the clicked row on a plain click', () => {
    const { result } = renderHook(() => useRowSelection(IDS));

    act(() => result.current.selectRow('b', makeMouseEvent()));

    expect(result.current.selectedIds).toEqual(new Set(['b']));
  });

  it('replaces the previous selection when clicking a different row', () => {
    const { result } = renderHook(() => useRowSelection(IDS));

    act(() => result.current.selectRow('a', makeMouseEvent()));
    act(() => result.current.selectRow('c', makeMouseEvent()));

    expect(result.current.selectedIds).toEqual(new Set(['c']));
  });

  it('sets the anchor to the clicked row', () => {
    const { result } = renderHook(() => useRowSelection(IDS));

    act(() => result.current.selectRow('d', makeMouseEvent()));

    expect(result.current.anchorId).toBe('d');
  });
});

describe('when toggling rows with Ctrl/Meta click', () => {
  it('adds the row to the selection when it is not selected', () => {
    const { result } = renderHook(() => useRowSelection(IDS));

    act(() => result.current.selectRow('a', makeMouseEvent()));
    act(() => result.current.selectRow('c', makeMouseEvent({ ctrlKey: true })));

    expect(result.current.selectedIds).toEqual(new Set(['a', 'c']));
  });

  it('removes the row from the selection when it is already selected', () => {
    const { result } = renderHook(() => useRowSelection(IDS));

    act(() => result.current.selectRow('a', makeMouseEvent()));
    act(() => result.current.selectRow('c', makeMouseEvent({ ctrlKey: true })));
    act(() => result.current.selectRow('a', makeMouseEvent({ ctrlKey: true })));

    expect(result.current.selectedIds).toEqual(new Set(['c']));
  });
});

describe('when range-selecting rows with Shift click', () => {
  it('selects all rows between the anchor and the shift-clicked row', () => {
    const { result } = renderHook(() => useRowSelection(IDS));

    act(() => result.current.selectRow('b', makeMouseEvent()));
    act(() => result.current.selectRow('d', makeMouseEvent({ shiftKey: true })));

    expect(result.current.selectedIds).toEqual(new Set(['b', 'c', 'd']));
  });

  it('selects rows in reverse order when clicking above the anchor', () => {
    const { result } = renderHook(() => useRowSelection(IDS));

    act(() => result.current.selectRow('d', makeMouseEvent()));
    act(() => result.current.selectRow('b', makeMouseEvent({ shiftKey: true })));

    expect(result.current.selectedIds).toEqual(new Set(['b', 'c', 'd']));
  });

  it('does not change the anchor on shift click', () => {
    const { result } = renderHook(() => useRowSelection(IDS));

    act(() => result.current.selectRow('b', makeMouseEvent()));
    act(() => result.current.selectRow('d', makeMouseEvent({ shiftKey: true })));

    expect(result.current.anchorId).toBe('b');
  });

  it('treats shift-click as a plain click when no anchor exists yet', () => {
    const { result } = renderHook(() => useRowSelection(IDS));

    // No anchor set — falls through to the plain-click branch
    act(() => result.current.selectRow('c', makeMouseEvent({ shiftKey: true })));

    expect(result.current.selectedIds).toEqual(new Set(['c']));
    expect(result.current.anchorId).toBe('c');
  });
});

describe('when using selectAll and clearSelection', () => {
  it('selectAll selects every id in the list', () => {
    const { result } = renderHook(() => useRowSelection(IDS));

    act(() => result.current.selectAll());

    expect(result.current.selectedIds).toEqual(new Set(IDS));
  });

  it('clearSelection empties the selection', () => {
    const { result } = renderHook(() => useRowSelection(IDS));

    act(() => result.current.selectAll());
    act(() => result.current.clearSelection());

    expect(result.current.selectedIds.size).toBe(0);
  });

  it('clearSelection resets the anchor to null', () => {
    const { result } = renderHook(() => useRowSelection(IDS));

    act(() => result.current.selectRow('a', makeMouseEvent()));
    act(() => result.current.clearSelection());

    expect(result.current.anchorId).toBeNull();
  });
});

describe('when using the isSelected helper', () => {
  it('returns true for a selected id', () => {
    const { result } = renderHook(() => useRowSelection(IDS));

    act(() => result.current.selectRow('b', makeMouseEvent()));

    expect(result.current.isSelected('b')).toBe(true);
  });

  it('returns false for an id that is not selected', () => {
    const { result } = renderHook(() => useRowSelection(IDS));

    act(() => result.current.selectRow('b', makeMouseEvent()));

    expect(result.current.isSelected('a')).toBe(false);
  });
});
