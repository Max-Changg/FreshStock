import { Trash2 } from 'lucide-react';
import { TableCell, TableRow } from '@/shared/components/Table';
import { InlineCell } from './InlineCell';
import { CATEGORIES, PLACEHOLDER_ID, UNITS } from '../constants/inventoryConstants';

interface PlaceholderRowProps {
  onCellSave: (colId: string, value: string) => void;
}

/**
 * Always-pinned bottom row that lets users type to start a new item.
 * Matches every column in InventoryTable (row-number, 6 data cols, status, trashed).
 */
export function PlaceholderRow({ onCellSave }: PlaceholderRowProps) {
  return (
    <TableRow className="border-t border-dashed border-forest/10 bg-forest/[0.015]">
      {/* Row number column — empty for placeholder */}
      <TableCell className="w-10 px-2" />

      {/* Name */}
      <TableCell>
        <InlineCell
          value=""
          inputType="text"
          placeholder="Add item…"
          onSave={(v) => onCellSave('name', v)}
        />
      </TableCell>

      {/* Category */}
      <TableCell>
        <InlineCell
          value={CATEGORIES[0]}
          options={CATEGORIES}
          onSave={(v) => onCellSave('category', v)}
        />
      </TableCell>

      {/* Quantity */}
      <TableCell>
        <InlineCell
          value=""
          inputType="number"
          placeholder="0"
          onSave={(v) => onCellSave('quantity', v)}
        />
      </TableCell>

      {/* Unit */}
      <TableCell>
        <InlineCell
          value={UNITS[0]}
          options={UNITS}
          onSave={(v) => onCellSave('unit', v)}
        />
      </TableCell>

      {/* Date Added */}
      <TableCell>
        <InlineCell
          value=""
          inputType="date"
          placeholder="Date added"
          onSave={(v) => onCellSave('dateAdded', v)}
        />
      </TableCell>

      {/* Expiry Date */}
      <TableCell>
        <InlineCell
          value=""
          inputType="date"
          placeholder="Expiry date"
          onSave={(v) => onCellSave('expiryDate', v)}
        />
      </TableCell>

      {/* Stock status — empty for placeholder */}
      <TableCell />

      {/* Trashed — disabled icon to keep column width consistent */}
      <TableCell>
        <span className="flex items-center justify-center px-1.5 py-1.5">
          <Trash2 className="h-4 w-4 text-forest/15" aria-hidden />
        </span>
      </TableCell>
    </TableRow>
  );
}

// Re-export PLACEHOLDER_ID so callers can import from this module
export { PLACEHOLDER_ID };
