import { flexRender, type Row } from '@tanstack/react-table';
import { Check } from 'lucide-react';
import { TableCell, TableRow } from '@/shared/components/Table';
import type { FlatRow } from '../types/inventory.types';

interface InventoryRowProps {
  row: Row<FlatRow>;
  rowIndex: number;        // 1-based display number shown in the row-number cell
  isSelected: boolean;
  onSelectRow: (id: string, event: React.MouseEvent) => void;
}

export function InventoryRow({ row, rowIndex, isSelected, onSelectRow }: InventoryRowProps) {
  const { rowKind } = row.original;
  const selectable = rowKind !== 'placeholder';

  const rowClass = isSelected ? 'border-l-2 border-blue-400 bg-blue-50' : '';

  /**
   * Clicking the row-number cell always toggles selection (select if unselected,
   * deselect if already selected). Achieved by forwarding a synthetic Ctrl+click
   * so useRowSelection's toggle branch runs regardless of the real modifier state.
   * Shift+click still works naturally for range-select from the row number.
   */
  function handleRowNumberClick(e: React.MouseEvent) {
    if (!selectable) return;
    if (e.shiftKey) {
      onSelectRow(row.original.id, e);
    } else {
      onSelectRow(row.original.id, {
        ...e,
        ctrlKey: true,
        metaKey: false,
        shiftKey: false,
      } as React.MouseEvent);
    }
  }

  return (
    <TableRow className={rowClass}>
      {/* ── Row-number / checkbox cell ── */}
      <TableCell
        className="w-10 select-none px-2 text-center"
        onClick={handleRowNumberClick}
      >
        {selectable && (
          isSelected ? (
            <span className="inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded bg-blue-500 text-white">
              <Check className="h-3 w-3" />
            </span>
          ) : (
            <span className="cursor-pointer text-xs text-forest/30 hover:text-forest/50">
              {rowIndex}
            </span>
          )
        )}
      </TableCell>

      {/* ── Data cells rendered by TanStack column defs ── */}
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}
