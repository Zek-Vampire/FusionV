import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronDown, LogOut, Settings, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSignOut } from '@/hooks/useSignOut';
import Avatar from '@/components/ui/Avatar';
import { paths } from '@/routes/paths';

export default function UserMenu() {
  const { user } = useAuth();
  const signOut = useSignOut();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) setOpen(false);
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-xl border border-line bg-surface px-2 py-1.5 text-sm transition-colors hover:border-lime/40"
      >
        <Avatar name={user?.fullName} size="sm" />
        <span className="hidden max-w-32 truncate text-silver sm:block">{user?.fullName || 'Account'}</span>
        <span className="sr-only">Account menu</span>
        <ChevronDown size={14} aria-hidden="true" className="text-muted" />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            role="menu"
            aria-label="Account"
            initial={reduce ? false : { opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-surface p-1.5 shadow-[0_32px_80px_-32px_rgba(0,0,0,0.9)]"
          >
            <div className="border-b border-line px-2.5 py-2">
              <p className="truncate text-sm font-semibold">{user?.fullName || 'Signed in'}</p>
              <p className="truncate text-xs text-muted">{user?.email || 'FusionV account'}</p>
            </div>
            <Link
              to={paths.profile}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="mt-1 flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-silver transition-colors hover:bg-elevated hover:text-ink"
            >
              <User size={15} aria-hidden="true" /> My profile
            </Link>
            <Link
              to={paths.settings}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-silver transition-colors hover:bg-elevated hover:text-ink"
            >
              <Settings size={15} aria-hidden="true" /> Settings
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                signOut();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-silver transition-colors hover:bg-elevated hover:text-lime"
            >
              <LogOut size={15} aria-hidden="true" /> Log out
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
