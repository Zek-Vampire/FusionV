import { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';
import { useDialogBehavior } from '@/hooks/useDialogBehavior';
import { cn } from '@/lib/cn';

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  className,
}) {
  const titleId = useId();
  const descriptionId = useId();
  const contentRef = useRef(null);
  const reduce = useReducedMotion();

  useDialogBehavior({ open, onClose, contentRef });

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[120] flex items-end justify-center p-4 sm:items-center">
          <motion.div
            data-testid="modal-backdrop"
            aria-hidden="true"
            onClick={closeOnBackdrop ? onClose : undefined}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          <motion.div
            ref={contentRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            tabIndex={-1}
            data-dialog-content=""
            className={cn(
              'relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_48px_120px_-40px_rgba(0,0,0,0.95)]',
              SIZES[size] ?? SIZES.md,
              className,
            )}
            initial={reduce ? false : { opacity: 0, y: 26, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: 18, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
              <div className="min-w-0">
                <h2 id={titleId} className="text-lg font-semibold tracking-tight">
                  {title}
                </h2>
                {description ? (
                  <p id={descriptionId} className="mt-1 text-sm text-muted">
                    {description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-elevated hover:text-ink"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="scrollbar-thin overflow-y-auto px-6 py-5">{children}</div>

            {footer ? (
              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-6 py-4">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
