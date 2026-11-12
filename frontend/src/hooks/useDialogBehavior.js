import { useEffect, useRef } from 'react';

const FOCUSABLE = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Shared dialog behaviour: Escape closes, Tab stays inside the dialog, the page
 * behind cannot scroll and focus returns to the trigger on close.
 */
export function useDialogBehavior({ open, onClose, contentRef }) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const previouslyFocused = useRef(null);
  const wasOpen = useRef(false);

  // Capture the trigger during render, before React applies autoFocus inside
  // the dialog. A useEffect would already see the auto-focused field.
  if (open && !wasOpen.current && typeof document !== 'undefined') {
    previouslyFocused.current = document.activeElement;
  }
  wasOpen.current = open;

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => {
      const root = contentRef?.current;
      if (!root) return;
      // Keep an explicit autoFocus target; otherwise move focus into the dialog.
      if (root.contains(document.activeElement)) return;
      const items = root.querySelectorAll(FOCUSABLE);
      const first = items[0] || root;
      first.focus?.();
    }, 0);

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        closeRef.current?.();
        return;
      }
      if (event.key !== 'Tab') return;

      const root = contentRef?.current;
      if (!root) return;
      const items = Array.from(root.querySelectorAll(FOCUSABLE));
      if (items.length === 0) {
        event.preventDefault();
        root.focus?.();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && (document.activeElement === first || document.activeElement === root)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.body.style.overflow = previousOverflow;
      const trigger = previouslyFocused.current;
      if (trigger instanceof HTMLElement && trigger.isConnected) {
        trigger.focus?.();
      }
    };
  }, [open, contentRef]);
}
