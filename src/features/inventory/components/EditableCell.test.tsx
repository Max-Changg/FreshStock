import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditableCell } from './EditableCell';

// todayISO reads from the Zustand clock store
vi.mock('../constants/inventoryConstants', async (importOriginal) => {
  const original = await importOriginal<typeof import('../constants/inventoryConstants')>();
  return {
    ...original,
    todayISO: () => '2025-06-10',
  };
});

function renderCell(overrides: Partial<Parameters<typeof EditableCell>[0]> = {}) {
  const onSave = vi.fn();
  const props = {
    columnId: 'name',
    rowKind: 'item' as const,
    value: 'Milk',
    onSave,
    ...overrides,
  };
  const result = render(<EditableCell {...props} />);
  return { ...result, onSave };
}

describe('when the cell is in display mode', () => {
  it('shows the current value as text', () => {
    renderCell({ value: 'Eggs' });
    expect(screen.getByText('Eggs')).toBeInTheDocument();
  });

  it('shows displayValue when provided instead of the raw value', () => {
    renderCell({ value: '2025-06-10', displayValue: 'Jun 10, 2025' });
    expect(screen.getByText('Jun 10, 2025')).toBeInTheDocument();
  });

  it('shows the placeholder when value is empty', () => {
    renderCell({ value: '', placeholder: 'Add item name…' });
    expect(screen.getByText('Add item name…')).toBeInTheDocument();
  });

  it('renders a pill span when pillClasses and a value are provided', () => {
    renderCell({ value: '2025-06-10', displayValue: 'Jun 10', pillClasses: 'bg-green-500 text-white' });
    const pill = screen.getByText('Jun 10');
    expect(pill.className).toContain('bg-green-500');
  });
});

describe('when clicking to enter edit mode', () => {
  it('switches to an input when a text cell is clicked', async () => {
    renderCell({ value: 'Milk' });

    await userEvent.click(screen.getByText('Milk'));

    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('switches to a select when an options cell is clicked', async () => {
    renderCell({ value: 'Produce', options: ['Produce', 'Dairy', 'Bakery'] });

    await userEvent.click(screen.getByText('Produce'));

    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
});

describe('when committing an edit', () => {
  it('calls onSave with the new value when Enter is pressed', async () => {
    const { onSave } = renderCell({ value: 'Milk' });

    await userEvent.click(screen.getByText('Milk'));
    const input = screen.getByRole('textbox');
    await userEvent.clear(input);
    await userEvent.type(input, 'Oat Milk{Enter}');

    expect(onSave).toHaveBeenCalledWith('Oat Milk');
  });

  it('calls onSave when the input loses focus (blur)', async () => {
    const { onSave } = renderCell({ value: 'Milk' });

    await userEvent.click(screen.getByText('Milk'));
    const input = screen.getByRole('textbox');
    await userEvent.clear(input);
    await userEvent.type(input, 'Yogurt');
    await userEvent.tab(); // trigger blur

    expect(onSave).toHaveBeenCalledWith('Yogurt');
  });

  it('calls onSave with selected option when a select value changes and Enter is pressed', async () => {
    const { onSave } = renderCell({
      value: 'Produce',
      options: ['Produce', 'Dairy', 'Bakery'],
    });

    await userEvent.click(screen.getByText('Produce'));
    const select = screen.getByRole('combobox');
    await userEvent.selectOptions(select, 'Dairy');
    await userEvent.keyboard('{Enter}');

    expect(onSave).toHaveBeenCalledWith('Dairy');
  });
});

describe('when cancelling an edit', () => {
  it('reverts to the original value and hides the input on Escape', async () => {
    const { onSave } = renderCell({ value: 'Milk' });

    await userEvent.click(screen.getByText('Milk'));
    const input = screen.getByRole('textbox');
    await userEvent.clear(input);
    await userEvent.type(input, 'Wrong{Escape}');

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText('Milk')).toBeInTheDocument();
  });
});

describe('when pressing Delete or Backspace in display mode', () => {
  it('calls onSave with the column default for the name column', async () => {
    const { onSave } = renderCell({ columnId: 'name', value: 'Milk' });

    const span = screen.getByText('Milk');
    span.focus();
    await userEvent.keyboard('{Delete}');

    expect(onSave).toHaveBeenCalledWith('');
  });

  it('calls onSave with "0" as the column default for the quantity column', async () => {
    const { onSave } = renderCell({ columnId: 'quantity', value: '5' });

    const span = screen.getByText('5');
    span.focus();
    await userEvent.keyboard('{Backspace}');

    expect(onSave).toHaveBeenCalledWith('0');
  });
});
