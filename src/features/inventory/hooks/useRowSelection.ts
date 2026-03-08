import { useCallback, useState } from 'react';

export interface UseRowSelectionReturn {
  selectedIds: Set<string>;
  anchorId: string | null;
  selectRow: (id: string, event: React.MouseEvent) => void;
  selectAll: () => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
}

/**
 * Google Sheets–style row selection.
 *
 * @param selectableIds  Ordered list of IDs that can be selected (item + draft rows).
 *                       Pass the current sorted display order so shift-range works correctly.
 */
export function useRowSelection(selectableIds: string[]): UseRowSelectionReturn {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [anchorId, setAnchorId] = useState<string | null>(null);

  const selectRow = useCallback(
    (id: string, event: React.MouseEvent) => {
      if (event.shiftKey && anchorId) {
        // Range select: everything between anchor and clicked row
        const anchorIdx = selectableIds.indexOf(anchorId);
        const clickedIdx = selectableIds.indexOf(id);
        if (anchorIdx !== -1 && clickedIdx !== -1) {
          const start = Math.min(anchorIdx, clickedIdx);
          const end = Math.max(anchorIdx, clickedIdx);
          setSelectedIds(new Set(selectableIds.slice(start, end + 1)));
          // Anchor does NOT change on shift+click
        }
      } else if (event.metaKey || event.ctrlKey) {
        // Toggle individual row; update anchor
        setSelectedIds((prev) => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        });
        setAnchorId(id);
      } else {
        // Plain click — select only this row
        setSelectedIds(new Set([id]));
        setAnchorId(id);
      }
    },
    [anchorId, selectableIds],
  );

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(selectableIds));
  }, [selectableIds]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setAnchorId(null);
  }, []);

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds],
  );

  return { selectedIds, anchorId, selectRow, selectAll, clearSelection, isSelected };
}
