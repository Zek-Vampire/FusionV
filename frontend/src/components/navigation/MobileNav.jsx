import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';
import { useDialogBehavior } from '@/hooks/useDialogBehavior';
import { cn } from '@/lib/cn';
import BrandLogo from '@/components/BrandLogo';
import { paths } from '@/routes/paths';
import { isPathActive, navigationGroups } from './navItems';

export default function MobileNav({
  open,
  onClose,
  groups = navigationGroups,
  footer,
  title = 'Navigation',
}) {
  const contentRef = useRef(null);
  const reduce = useReducedMotion();
  const location = useLocation();

  useDialogBehavior({ open, onClose, contentRef });

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[150] lg:hidden">
          <motion.div
            aria-hidden="true"
            data-testid="mobile-nav-backdrop"
            onClick={onClose}
            className="absolute inset-0 bg-background/85 backdrop-blur-sm"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          <motion.aside
            ref={contentRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            data-dialog-content=""
            className="relative flex h-full w-[86%] max-w-sm flex-col border-r border-line bg-surface shadow-[32px_0_80px_-40px_rgba(0,0,0,0.9)]"
            initial={reduce ? false : { x: '-100%' }}
            animate={{ x: 0 }}
            exit={reduce ? undefined : { x: '-100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <Link to={paths.home} onClick={onClose} aria-label="FusionV home" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime">
                <BrandLogo imageClassName="h-9 w-9" textClassName="text-lg" />
              </Link>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close navigation"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:text-ink"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <nav aria-label="Mobile" className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4">
              {groups.map((group) => (
                <div key={group.label} className="mb-5">
                  <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                    {group.label}
                  </p>
                  <ul className="space-y-0.5">
                    {group.items.map((item) => {
                      const active = isPathActive(location.pathname, item.to);
                      const Icon = item.icon;
                      return (
                        <li key={item.to}>
                          <Link
                            to={item.to}
                            onClick={onClose}
                            aria-current={active ? 'page' : undefined}
                            className={cn(
                              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                              active
                                ? 'border border-lime/20 bg-elevated text-ink'
                                : 'text-silver hover:bg-elevated/70 hover:text-ink',
                            )}
                          >
                            <Icon
                              size={17}
                              aria-hidden="true"
                              className={active ? 'text-lime' : 'text-muted'}
                            />
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>

            {footer ? <div className="border-t border-line p-4">{footer}</div> : null}
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
