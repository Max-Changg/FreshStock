import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddItemModal } from './AddItemModal';
import type { InventoryItem } from '../types';

function renderModal(overrides: Partial<Parameters<typeof AddItemModal>[0]> = {}) {
  const onClose = vi.fn();
  const onAdd = vi.fn();
  const props = {
    isOpen: true,
    onClose,
    onAdd,
    ...overrides,
  };
  render(<AddItemModal {...props} />);
  return { onClose, onAdd };
}

async function fillForm({
  name = 'Organic Milk',
  quantity = '5',
  expiry = '2025-12-01',
}: {
  name?: string;
  quantity?: string;
  expiry?: string;
} = {}) {
  if (name) {
    await userEvent.clear(screen.getByLabelText(/item name/i));
    await userEvent.type(screen.getByLabelText(/item name/i), name);
  }
  if (quantity) {
    await userEvent.clear(screen.getByLabelText(/quantity/i));
    await userEvent.type(screen.getByLabelText(/quantity/i), quantity);
  }
  if (expiry) {
    await userEvent.type(screen.getByLabelText(/expiry date/i), expiry);
  }
}

describe('when the modal is closed', () => {
  it('renders nothing when isOpen is false', () => {
    renderModal({ isOpen: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('when adding a new item', () => {
  it('renders the Add Item title in add mode', () => {
    renderModal();
    expect(screen.getByText('Add Inventory Item')).toBeInTheDocument();
  });

  it('calls onAdd with the correct fields on a valid submission', async () => {
    const { onAdd, onClose } = renderModal();
    await fillForm({ name: 'Organic Milk', quantity: '3', expiry: '2025-12-01' });

    await userEvent.click(screen.getByRole('button', { name: /add item/i }));

    expect(onAdd).toHaveBeenCalledOnce();
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Organic Milk',
        quantity: 3,
        expiryDate: '2025-12-01',
      }),
    );
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('sets initialQuantity equal to quantity on add', async () => {
    const { onAdd } = renderModal();
    await fillForm({ name: 'Eggs', quantity: '12', expiry: '2025-10-01' });

    await userEvent.click(screen.getByRole('button', { name: /add item/i }));

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ quantity: 12, initialQuantity: 12 }),
    );
  });
});

describe('when the form has invalid input', () => {
  it('does not call onAdd when the name field is empty', async () => {
    const { onAdd } = renderModal();
    // Leave name empty, fill rest
    await userEvent.clear(screen.getByLabelText(/item name/i));
    await userEvent.type(screen.getByLabelText(/quantity/i), '5');
    await userEvent.type(screen.getByLabelText(/expiry date/i), '2025-12-01');

    await userEvent.click(screen.getByRole('button', { name: /add item/i }));

    expect(onAdd).not.toHaveBeenCalled();
  });

  it('does not call onAdd when quantity is zero', async () => {
    const { onAdd } = renderModal();
    await userEvent.type(screen.getByLabelText(/item name/i), 'Milk');
    await userEvent.clear(screen.getByLabelText(/quantity/i));
    await userEvent.type(screen.getByLabelText(/quantity/i), '0');
    await userEvent.type(screen.getByLabelText(/expiry date/i), '2025-12-01');

    await userEvent.click(screen.getByRole('button', { name: /add item/i }));

    expect(onAdd).not.toHaveBeenCalled();
  });

  it('does not call onAdd when expiry date is missing', async () => {
    const { onAdd } = renderModal();
    await userEvent.type(screen.getByLabelText(/item name/i), 'Milk');
    await userEvent.type(screen.getByLabelText(/quantity/i), '5');
    // Leave expiry empty

    await userEvent.click(screen.getByRole('button', { name: /add item/i }));

    expect(onAdd).not.toHaveBeenCalled();
  });
});

describe('when editing an existing item', () => {
  const editItem: InventoryItem = {
    id: 'item-abc',
    name: 'Old Name',
    category: 'Dairy',
    quantity: 10,
    unit: 'L',
    dateAdded: '2025-01-01',
    expiryDate: '2025-07-01',
  };

  it('renders "Edit Item" as the modal title', () => {
    renderModal({ editItem });
    expect(screen.getByText('Edit Item')).toBeInTheDocument();
  });

  it('pre-populates the form with the existing item values', () => {
    renderModal({ editItem });
    expect(screen.getByLabelText<HTMLInputElement>(/item name/i).value).toBe('Old Name');
    expect(screen.getByLabelText<HTMLInputElement>(/quantity/i).value).toBe('10');
  });

  it('calls onEdit with the updated values', async () => {
    const onEdit = vi.fn();
    renderModal({ editItem, onEdit });

    await userEvent.clear(screen.getByLabelText(/item name/i));
    await userEvent.type(screen.getByLabelText(/item name/i), 'New Name');
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

    expect(onEdit).toHaveBeenCalledWith('item-abc', expect.objectContaining({ name: 'New Name' }));
  });
});

describe('when cancelling', () => {
  it('calls onClose when the Cancel button is clicked', async () => {
    const { onClose } = renderModal();
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
