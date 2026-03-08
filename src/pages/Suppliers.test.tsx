import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Suppliers } from './Suppliers';

// No mocking needed — Suppliers only uses static data and pure state

describe('when the Suppliers page renders with no filters', () => {
  it('shows the page heading', () => {
    render(<Suppliers />);
    expect(screen.getByRole('heading', { name: /suppliers/i })).toBeInTheDocument();
  });

  it('renders all 6 supplier cards by default', () => {
    render(<Suppliers />);
    // Each supplier card has a "View Details" button
    expect(screen.getAllByRole('button', { name: /view details/i })).toHaveLength(6);
  });

  it('displays supplier names', () => {
    render(<Suppliers />);
    expect(screen.getByText('Herb Haven')).toBeInTheDocument();
    expect(screen.getByText('Happy Hens Co-op')).toBeInTheDocument();
  });

  it('shows a result count', () => {
    render(<Suppliers />);
    expect(screen.getByText(/6 suppliers found/i)).toBeInTheDocument();
  });
});

describe('when filtering suppliers by text', () => {
  it('shows only matching suppliers when a name is typed', async () => {
    render(<Suppliers />);

    await userEvent.type(
      screen.getByPlaceholderText(/search suppliers or products/i),
      'Herb Haven',
    );

    expect(screen.getByText('Herb Haven')).toBeInTheDocument();
    expect(screen.queryByText('Sunshine Gardens')).not.toBeInTheDocument();
  });

  it('shows the empty state when no suppliers match the search', async () => {
    render(<Suppliers />);

    await userEvent.type(
      screen.getByPlaceholderText(/search suppliers or products/i),
      'xyznonexistent',
    );

    expect(screen.getByText(/no suppliers match your search/i)).toBeInTheDocument();
  });

  it('restores all suppliers after the search is cleared', async () => {
    render(<Suppliers />);

    const input = screen.getByPlaceholderText(/search suppliers or products/i);
    await userEvent.type(input, 'Herb Haven');
    await userEvent.clear(input);

    expect(screen.getAllByRole('button', { name: /view details/i })).toHaveLength(6);
  });
});

describe('when filtering by distance', () => {
  it('removes suppliers beyond the selected distance limit', async () => {
    render(<Suppliers />);

    // The distance select is the 3rd combobox on the page (Category, Certification, Distance)
    const selects = screen.getAllByRole('combobox');
    const distanceSelect = selects[2];

    await userEvent.selectOptions(distanceSelect, 'Under 5 miles');

    // Fair Trade Coffee Co. is 12 miles away — should not appear
    expect(screen.queryByText('Fair Trade Coffee Co.')).not.toBeInTheDocument();
  });

  it('shows fewer results as distance limit decreases', async () => {
    render(<Suppliers />);

    const selects = screen.getAllByRole('combobox');
    const distanceSelect = selects[2];

    await userEvent.selectOptions(distanceSelect, 'Under 5 miles');

    const buttons = screen.queryAllByRole('button', { name: /view details/i });
    expect(buttons.length).toBeLessThan(6);
  });
});

describe('when filtering by category', () => {
  it('shows only Produce suppliers when Produce is selected', async () => {
    render(<Suppliers />);

    const selects = screen.getAllByRole('combobox');
    const categorySelect = selects[0];

    await userEvent.selectOptions(categorySelect, 'Produce');

    // Green Valley Farms is Dairy — should be hidden
    expect(screen.queryByText('Green Valley Farms')).not.toBeInTheDocument();
  });
});
