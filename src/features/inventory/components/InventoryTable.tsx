import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronUp, ChevronsUpDown, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/Table';
import { useInventory } from '../hooks/useInventory';
import { useInventoryStore } from '../store/inventoryStore';
import { useRowSelection } from '../hooks/useRowSelection';
import type { InventoryItem } from '../types';
import type { DraftRow, FlatRow } from '../types/inventory.types';
import { CATEGORIES, PLACEHOLDER_ID, UNITS, newDraft, todayISO } from '../constants/inventoryConstants';
import { expiryInputClasses, isDraftEmpty, stockLabel, stockPillClasses } from '../utils/inventoryUtils';
import { useClock } from '@/shared/hooks/useClock';
import { useClockStore } from '@/shared/store/clockStore';
import { addUsageRecord } from '@/lib/db';
import { showToast } from '@/shared/utils/showToast';
import { InlineCell } from './InlineCell';
import { InventoryRow } from './InventoryRow';
import { PlaceholderRow } from './PlaceholderRow';

// ─── TrashCell ────────────────────────────────────────────────────────────────

interface TrashCellProps {
  itemId: string;
  itemName: string;
  itemQuantity: number;
  itemUnit: string;
  updateMode: boolean;
  isConfirming: boolean;
  onOpenConfirm: () => void;
  onCloseConfirm: () => void;
  onConfirm: () => void;
}

function TrashCell({
  itemName,
  updateMode,
  isConfirming,
  onOpenConfirm,
  onCloseConfirm,
  onConfirm,
}: TrashCellProps) {
  if (!updateMode) {
    return (
      <button
        disabled
        aria-label="Trash item (only available in update mode)"
        className="rounded-md p-1.5 opacity-30 cursor-not-allowed text-muted-foreground"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    );
  }

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onOpenConfirm();
        }}
        aria-label="Trash item"
        className="rounded-md p-1.5 transition-colors text-muted-foreground hover:text-destructive hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {isConfirming && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onCloseConfirm();
          }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" />

          {/* Dialog */}
          <div
            className="relative z-10 w-full max-w-sm rounded-xl bg-white shadow-xl border border-border p-6 mx-4"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="mb-1 flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-destructive" />
              <h3 className="text-base font-semibold text-foreground">Trash item?</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              <span className="font-medium text-foreground">{itemName}</span> will be removed and its remaining quantity logged as waste.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={onCloseConfirm}
                className="rounded-md border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="rounded-md bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
              >
                Yes, trash it
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

// ─── InventoryTable ───────────────────────────────────────────────────────────

export interface InventoryTableProps {
  searchQuery: string;
  usageMode?: boolean;
}

export function InventoryTable({ searchQuery, usageMode = false }: InventoryTableProps) {
  const { items, addItem, updateItem, removeItem } = useInventory();
  const { today } = useClock();

  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [confirmingTrashId, setConfirmingTrashId] = useState<string | null>(null);

  // Keep a ref so handleCellSave always reads the latest value without
  // needing usageMode in its useCallback dep array (which would re-create
  // every EditableCell's onSave handler on every toggle).
  const usageModeRef = useRef(usageMode);
  useEffect(() => { usageModeRef.current = usageMode; }, [usageMode]);

  // ── Ref for click-outside detection ──────────────────────────────────────
  const tableWrapperRef = useRef<HTMLDivElement>(null);

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return items;
    return items.filter(
      (i) => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q),
    );
  }, [items, searchQuery]);

  // ── Table data (items + drafts — placeholder rendered separately) ──────────
  const tableData = useMemo<FlatRow[]>(
    () => [
      ...filteredItems.map((item): FlatRow => ({
        id: item.id,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        dateAdded: item.dateAdded,
        expiryDate: item.expiryDate ?? '',
        rowKind: 'item',
      })),
      ...drafts.map((d): FlatRow => ({
        id: d.draftId,
        name: d.name,
        category: d.category,
        quantity: d.quantity,
        unit: d.unit,
        dateAdded: d.dateAdded,
        expiryDate: d.expiryDate,
        rowKind: 'draft',
      })),
    ],
    [filteredItems, drafts],
  );

  // ── Cell save handler ─────────────────────────────────────────────────────
  const handleCellSave = useCallback(
    (rowId: string, colId: string, rawValue: string, rowKind: FlatRow['rowKind']) => {
      const coerce = (v: string): string | number =>
        colId === 'quantity' ? Math.max(0, parseFloat(v) || 0) : v;

      if (rowKind === 'item') {
        if (colId === 'name' && !rawValue.trim()) {
          removeItem(rowId);
          return;
        }
        if (colId === 'quantity' && usageModeRef.current) {
          const currentItem = useInventoryStore.getState().items.find((i) => i.id === rowId);
          if (currentItem) {
            const newQty = Math.max(0, parseFloat(rawValue) || 0);
            const quantityUsed = currentItem.quantity - newQty;
            if (quantityUsed > 0) {
              void addUsageRecord({
                id: crypto.randomUUID(),
                inventoryItemId: rowId,
                inventoryItemName: currentItem.name,
                quantityUsed,
                unit: currentItem.unit,
                date: useClockStore.getState().getToday(),
                source: 'manual',
              });
            }
          }
        }
        updateItem(rowId, { [colId]: coerce(rawValue) } as Partial<Omit<InventoryItem, 'id'>>);
        return;
      }

      if (rowKind === 'draft') {
        setDrafts((prev) => {
          const updated = prev.map((d) =>
            d.draftId === rowId ? { ...d, [colId]: coerce(rawValue) } : d,
          );
          const thisDraft = updated.find((d) => d.draftId === rowId);
          if (!thisDraft) return prev;
          if (thisDraft.name.trim()) {
            addItem({
              name: thisDraft.name.trim(),
              category: thisDraft.category,
              quantity: thisDraft.quantity,
              initialQuantity: thisDraft.quantity,
              unit: thisDraft.unit,
              dateAdded: thisDraft.dateAdded || todayISO(),
              expiryDate: thisDraft.expiryDate,
            });
            return prev.filter((d) => d.draftId !== rowId && !isDraftEmpty(d));
          }
          return updated;
        });
        return;
      }

      if (rowKind === 'placeholder') {
        if (!rawValue.trim()) return;
        const coerced = coerce(rawValue);
        if (colId === 'name') {
          addItem({
            name: rawValue.trim(),
            category: CATEGORIES[0],
            quantity: 0,
            initialQuantity: 0,
            unit: UNITS[0],
            dateAdded: todayISO(),
            expiryDate: '',
          });
        } else {
          setDrafts((prev) => {
            const d: DraftRow = { ...newDraft(), [colId]: coerced };
            return [...prev.filter((x) => !isDraftEmpty(x)), d];
          });
        }
      }
    },
    [addItem, updateItem, removeItem],
  );

  // ── Trash confirm handler ─────────────────────────────────────────────────
  const handleTrashConfirm = useCallback(
    async (item: FlatRow) => {
      setConfirmingTrashId(null);
      // Write the waste record first so it is committed to IndexedDB before
      // removeItem fires. removeItem triggers a Zustand update which causes
      // useWasteInsights to re-run; the record must exist in IDB by then.
      await addUsageRecord({
        id: crypto.randomUUID(),
        inventoryItemId: item.id,
        inventoryItemName: item.name,
        quantityUsed: item.quantity,
        unit: item.unit,
        date: useClockStore.getState().getToday(),
        source: 'expired_removal',
      });
      removeItem(item.id);
      showToast(`${item.name} trashed and logged as waste`);
    },
    [removeItem],
  );

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns = useMemo<ColumnDef<FlatRow>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Item Name',
        cell: ({ row }) => (
          <InlineCell
            value={row.original.name}
            inputType="text"
            placeholder="Add item…"
            onSave={(v) => handleCellSave(row.original.id, 'name', v, row.original.rowKind)}
          />
        ),
      },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: ({ row }) => (
          <InlineCell
            value={row.original.category}
            options={CATEGORIES}
            onSave={(v) => handleCellSave(row.original.id, 'category', v, row.original.rowKind)}
          />
        ),
      },
      {
        accessorKey: 'quantity',
        header: 'Qty',
        cell: ({ row }) => (
          <InlineCell
            value={String(row.original.rowKind === 'placeholder' ? '' : row.original.quantity)}
            inputType="number"
            placeholder="0"
            onSave={(v) => handleCellSave(row.original.id, 'quantity', v, row.original.rowKind)}
          />
        ),
      },
      {
        accessorKey: 'unit',
        header: 'Unit',
        cell: ({ row }) => (
          <InlineCell
            value={row.original.unit}
            options={UNITS}
            onSave={(v) => handleCellSave(row.original.id, 'unit', v, row.original.rowKind)}
          />
        ),
      },
      {
        accessorKey: 'dateAdded',
        header: 'Date Added',
        cell: ({ row }) => (
          <InlineCell
            value={row.original.dateAdded}
            inputType="date"
            placeholder="Date added"
            onSave={(v) => handleCellSave(row.original.id, 'dateAdded', v, row.original.rowKind)}
          />
        ),
      },
      {
        accessorKey: 'expiryDate',
        header: 'Expiry Date',
        cell: ({ row }) => {
          const val = row.original.expiryDate;
          return (
            <InlineCell
              value={val}
              inputType="date"
              placeholder="Expiry date"
              accentClasses={val ? expiryInputClasses(val, today) : undefined}
              onSave={(v) => handleCellSave(row.original.id, 'expiryDate', v, row.original.rowKind)}
            />
          );
        },
      },
      {
        id: 'stock-status',
        header: 'Status',
        enableSorting: true,
        sortingFn: (rowA, rowB) => {
          const level = (qty: number) => (qty === 0 ? 0 : qty < 3 ? 1 : 2);
          return level(rowA.original.quantity) - level(rowB.original.quantity);
        },
        cell: ({ row }) => {
          if (row.original.rowKind === 'placeholder') return null;
          const qty = row.original.quantity;
          return (
            <span
              className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${stockPillClasses(qty)}`}
            >
              {stockLabel(qty)}
            </span>
          );
        },
      },
      {
        id: 'trash',
        header: '',
        cell: ({ row }) => {
          if (row.original.rowKind !== 'item') return null;
          const item = row.original;
          return (
            <TrashCell
              itemId={item.id}
              itemName={item.name}
              itemQuantity={item.quantity}
              itemUnit={item.unit}
              updateMode={usageMode}
              isConfirming={confirmingTrashId === item.id}
              onOpenConfirm={() => setConfirmingTrashId(item.id)}
              onCloseConfirm={() => setConfirmingTrashId(null)}
              onConfirm={() => handleTrashConfirm(item)}
            />
          );
        },
      },
    ],
    [handleCellSave, today, usageMode, confirmingTrashId, handleTrashConfirm],
  );

  // ── Table instance ────────────────────────────────────────────────────────
  const table = useReactTable({
    data: tableData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
  });

  const sortedRows = table.getRowModel().rows;

  // ── Row selection ─────────────────────────────────────────────────────────
  // Only item + draft rows are selectable; placeholder is excluded.
  const selectableIds = useMemo(
    () => sortedRows.filter((r) => r.original.rowKind !== 'placeholder').map((r) => r.id),
    [sortedRows],
  );

  const { selectedIds, selectRow, selectAll, clearSelection, isSelected } =
    useRowSelection(selectableIds);

  // Click outside the table → clear selection
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (tableWrapperRef.current && !tableWrapperRef.current.contains(e.target as Node)) {
        clearSelection();
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [clearSelection]);

  // ── Select-all checkbox state ─────────────────────────────────────────────
  const allSelected =
    selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id));
  const someSelected = !allSelected && selectableIds.some((id) => selectedIds.has(id));

  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  function handleSelectAllChange() {
    if (allSelected) clearSelection();
    else selectAll();
  }

  // ── Keyboard: Delete selected rows ────────────────────────────────────────
  function handleTableKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.size > 0) {
      e.preventDefault();
      const count = selectedIds.size;
      const confirmed = window.confirm(
        `Delete ${count} item${count > 1 ? 's' : ''}? This cannot be undone.`,
      );
      if (confirmed) {
        selectedIds.forEach((id) => {
          if (id.startsWith('draft-')) {
            setDrafts((prev) => prev.filter((d) => d.draftId !== id));
          } else {
            removeItem(id);
          }
        });
        clearSelection();
      }
    }
  }

  // ── PlaceholderRow save handler ───────────────────────────────────────────
  const handlePlaceholderSave = useCallback(
    (colId: string, value: string) => {
      handleCellSave(PLACEHOLDER_ID, colId, value, 'placeholder');
    },
    [handleCellSave],
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      ref={tableWrapperRef}
      tabIndex={0}
      onKeyDown={handleTableKeyDown}
      className="rounded-xl border border-forest/10 bg-white shadow-sm overflow-hidden outline-none focus-within:ring-1 focus-within:ring-blue-200"
    >
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {/* Row-number column header — select-all checkbox */}
              <TableHead className="w-10 px-2 text-center">
                <input
                  ref={selectAllCheckboxRef}
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleSelectAllChange}
                  aria-label="Select all rows"
                  className="h-3.5 w-3.5 cursor-pointer rounded accent-blue-500"
                />
              </TableHead>

              {/* Data column headers */}
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={
                    header.column.getCanSort()
                      ? 'cursor-pointer select-none hover:bg-forest/5'
                      : ''
                  }
                  onClick={
                    header.column.getCanSort()
                      ? header.column.getToggleSortingHandler()
                      : undefined
                  }
                >
                  <div className="flex items-center gap-1">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === 'asc' && <ChevronUp className="h-4 w-4" />}
                    {header.column.getIsSorted() === 'desc' && <ChevronDown className="h-4 w-4" />}
                    {!header.column.getIsSorted() && header.column.getCanSort() && (
                      <ChevronsUpDown className="h-4 w-4 opacity-50" />
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>


          {sortedRows.map((row, index) => (
            <InventoryRow
              key={row.id}
              row={row}
              rowIndex={index + 1}
              isSelected={isSelected(row.id)}
              onSelectRow={selectRow}
            />
          ))}

          {/* Placeholder row — always pinned to the bottom */}
          <PlaceholderRow onCellSave={handlePlaceholderSave} />
        </TableBody>
      </Table>
    </div>
  );
}
