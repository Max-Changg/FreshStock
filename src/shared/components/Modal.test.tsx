import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from './Modal';

describe('when the modal is closed', () => {
  it('renders nothing when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()} title="Test Modal">
        <p>Content</p>
      </Modal>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });
});

describe('when the modal is open', () => {
  it('renders the dialog with the given title', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Add Item">
        <p>Form here</p>
      </Modal>,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Add Item')).toBeInTheDocument();
  });

  it('renders children inside the modal', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test">
        <p>Dialog content</p>
      </Modal>,
    );

    expect(screen.getByText('Dialog content')).toBeInTheDocument();
  });

  it('calls onClose when the backdrop is clicked', async () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test">
        <p>Content</p>
      </Modal>,
    );

    // The backdrop is the fixed inset-0 div behind the modal
    const backdrop = document.querySelector('[aria-hidden="true"]') as HTMLElement;
    await userEvent.click(backdrop);

    expect(handleClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when the close button is clicked', async () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test">
        <p>Content</p>
      </Modal>,
    );

    await userEvent.click(screen.getByRole('button', { name: /close modal/i }));

    expect(handleClose).toHaveBeenCalledOnce();
  });

  it('does not call onClose when clicking inside the modal dialog', async () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test">
        <p>Inside content</p>
      </Modal>,
    );

    await userEvent.click(screen.getByText('Inside content'));

    expect(handleClose).not.toHaveBeenCalled();
  });
});
