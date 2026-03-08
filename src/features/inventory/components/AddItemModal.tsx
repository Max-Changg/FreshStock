import { useState, useEffect, type FormEvent } from 'react';
import { Modal } from '@/shared/components/Modal';
import { Button } from '@/shared/components/Button';
import type { InventoryItem } from '../types';

const CATEGORIES = ['Produce', 'Dairy', 'Bakery', 'Beverages', 'Dry Goods', 'Other'];
const UNITS = ['units', 'kg', 'g', 'L', 'ml', 'bunches', 'loaves', 'bags'];

export interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd?: (item: Omit<InventoryItem, 'id'>) => void;
  onEdit?: (id: string, updates: Partial<Omit<InventoryItem, 'id'>>) => void;
  editItem?: InventoryItem | null;
}

export function AddItemModal({ isOpen, onClose, onAdd, onEdit, editItem }: AddItemModalProps) {
  const isEditMode = Boolean(editItem);
  const today = new Date().toISOString().split('T')[0];

  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState(UNITS[0]);
  const [expiryDate, setExpiryDate] = useState('');

  useEffect(() => {
    if (editItem) {
      setName(editItem.name);
      setCategory(editItem.category);
      setQuantity(String(editItem.quantity));
      setUnit(editItem.unit);
      setExpiryDate(editItem.expiryDate ?? '');
    } else {
      setName('');
      setCategory(CATEGORIES[0]);
      setQuantity('');
      setUnit(UNITS[0]);
      setExpiryDate('');
    }
  }, [editItem, isOpen]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const qty = parseFloat(quantity);
    if (!name.trim() || isNaN(qty) || qty <= 0 || !expiryDate) return;

    if (isEditMode && editItem && onEdit) {
      onEdit(editItem.id, {
        name: name.trim(),
        category,
        quantity: qty,
        unit,
        dateAdded: editItem.dateAdded,
        expiryDate,
      });
    } else if (onAdd) {
      onAdd({
        name: name.trim(),
        category,
        quantity: qty,
        initialQuantity: qty,
        unit,
        dateAdded: today,
        expiryDate,
      });
    }

    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? 'Edit Item' : 'Add Inventory Item'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-forest mb-1">
            Item Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-forest/20 bg-cream px-3 py-2 text-forest placeholder:text-forest/50 focus:outline-none focus:ring-2 focus:ring-forest/50"
            placeholder="e.g. Organic Milk"
            required
          />
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-forest mb-1">
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-forest/20 bg-cream px-3 py-2 text-forest focus:outline-none focus:ring-2 focus:ring-forest/50"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-forest mb-1">
              Quantity
            </label>
            <input
              id="quantity"
              type="number"
              min="0.01"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-lg border border-forest/20 bg-cream px-3 py-2 text-forest focus:outline-none focus:ring-2 focus:ring-forest/50"
              required
            />
          </div>
          <div>
            <label htmlFor="unit" className="block text-sm font-medium text-forest mb-1">
              Unit
            </label>
            <select
              id="unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full rounded-lg border border-forest/20 bg-cream px-3 py-2 text-forest focus:outline-none focus:ring-2 focus:ring-forest/50"
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="expiry" className="block text-sm font-medium text-forest mb-1">
            Expiry Date
          </label>
          <input
            id="expiry"
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="w-full rounded-lg border border-forest/20 bg-cream px-3 py-2 text-forest focus:outline-none focus:ring-2 focus:ring-forest/50"
            required
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{isEditMode ? 'Save Changes' : 'Add Item'}</Button>
        </div>
      </form>
    </Modal>
  );
}
