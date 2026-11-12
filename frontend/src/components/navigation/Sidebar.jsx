import { Link, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSignOut } from '@/hooks/useSignOut';
import Avatar from '@/components/ui/Avatar';
import BrandLogo from '@/components/BrandLogo';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/cn';
import { paths } from '@/routes/paths';
import { isPathActive, navigationGroups } from './navItems';

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const reduce = useReducedMotion();
  const signOut = useSignOut();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-line bg-surface/70 backdrop-blur-xl lg:flex">
      <div className="border-b border-line px-5 py-5">
        <Link to={paths.home} aria-label="FusionV home" className="inline-flex rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime">
          <BrandLogo imageClassName="h-10 w-10" textClassName="text-xl" />
        </Link>
        <div className="mt-3">
          <Badge variant="lime" dot>
            Design system · Phase 3
          </Badge>
        </div>
      </div>

      <nav aria-label="Primary" className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4">
        {navigationGroups.map((group) => (
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
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                        active ? 'text-ink' : 'text-silver hover:bg-elevated/70 hover:text-ink',
                      )}
                    >
                      {active ? (
                        <motion.span
                          layoutId="sidebar-active"
                          aria-hidden="true"
                          className="absolute inset-0 rounded-xl border border-lime/20 bg-elevated"
                          transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 32 }}
                        />
                      ) : null}
                      <Icon
                        size={17}
                        aria-hidden="true"
                        className={cn('relative z-10 shrink-0', active ? 'text-lime' : 'text-muted')}
                      />
                      <span className="relative z-10">{item.label}</span>
                      {active ? (
                        <span aria-hidden="true" className="relative z-10 ml-auto h-1.5 w-1.5 rounded-full bg-lime" />
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-line p-3">
        <div className="flex items-center gap-3 rounded-xl border border-line bg-background/40 p-3">
          <Avatar name={user?.fullName} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{user?.fullName || 'Signed in'}</p>
            <p className="truncate text-xs text-muted">{user?.email || 'FusionV account'}</p>
          </div>
          <button
            type="button"
            onClick={signOut}
            aria-label="Log out"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-elevated hover:text-lime"
          >
            <LogOut size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
}
