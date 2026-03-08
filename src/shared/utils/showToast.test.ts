import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { showToast } from './showToast';

describe('when showing a toast notification', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.useRealTimers();
  });

  it('appends a div with the message text to document.body', () => {
    showToast('Item added');
    const toasts = document.body.querySelectorAll('div');
    const found = Array.from(toasts).some((el) => el.textContent?.includes('Item added'));
    expect(found).toBe(true);
  });

  it('starts the fade-out after the duration elapses', () => {
    showToast('Temporary message', 500);
    const el = document.body.querySelector('div')!;
    expect(el).not.toBeNull();
    // Before duration — opacity has not been set to '0'
    vi.advanceTimersByTime(300);
    expect(el.style.opacity).not.toBe('0');
    // After duration — fade-out initiated
    vi.advanceTimersByTime(300);
    expect(el.style.opacity).toBe('0');
  });

  it('renders multiple simultaneous toasts independently', () => {
    showToast('First');
    showToast('Second');
    const body = document.body.innerHTML;
    expect(body).toContain('First');
    expect(body).toContain('Second');
  });

  it('uses 3000ms as the default duration', () => {
    showToast('Default duration');
    const el = document.body.querySelector('div')!;
    vi.advanceTimersByTime(2999);
    expect(el.style.opacity).not.toBe('0');
    vi.advanceTimersByTime(2);
    expect(el.style.opacity).toBe('0');
  });
});
