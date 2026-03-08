/**
 * Lightweight DOM-based toast — no React context needed.
 * Appends a styled div to document.body that auto-dismisses after `durationMs`.
 */
export function showToast(message: string, durationMs = 3000): void {
  const el = document.createElement('div');

  Object.assign(el.style, {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: '9999',
    padding: '10px 16px',
    borderRadius: '8px',
    background: '#1a2e1a',
    color: '#ffffff',
    fontSize: '14px',
    fontFamily: 'Inter, sans-serif',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    opacity: '0',
    transform: 'translateY(8px)',
    transition: 'opacity 180ms ease, transform 180ms ease',
    maxWidth: '320px',
    lineHeight: '1.4',
    pointerEvents: 'none',
  });

  el.textContent = message;
  document.body.appendChild(el);

  requestAnimationFrame(() => {
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  });

  const timer = setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(8px)';
    el.addEventListener('transitionend', () => el.remove(), { once: true });
  }, durationMs);

  // Safety cleanup if element is already removed
  el.addEventListener('remove', () => clearTimeout(timer), { once: true });
}
