import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsBar } from './StatsBar';

describe('when rendering the StatsBar', () => {
  it('displays the total item count', () => {
    render(<StatsBar total={42} expiringSoon={3} expired={1} />);
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Total Items')).toBeInTheDocument();
  });

  it('displays the expiring soon count', () => {
    render(<StatsBar total={10} expiringSoon={5} expired={0} />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Expiring Soon')).toBeInTheDocument();
  });

  it('displays the expired count', () => {
    render(<StatsBar total={10} expiringSoon={2} expired={3} />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Expired')).toBeInTheDocument();
  });

  it('renders zero counts without errors', () => {
    render(<StatsBar total={0} expiringSoon={0} expired={0} />);
    const zeros = screen.getAllByText('0');
    expect(zeros).toHaveLength(3);
  });
});
