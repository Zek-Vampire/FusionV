import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Menu, Search } from 'lucide-react';
import { SearchInput } from '@/components/ui/FormControls';
import { useNotificationsData } from '@/hooks/useNotificationsData';
import { paths } from '@/routes/paths';
import { pageTitleFor } from './navItems';
import UserMenu from './UserMenu';

export default function Topbar({ onOpenMenu }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const { unreadCount } = useNotificationsData();

  function submit(value) {
    const term = String(value ?? '').trim();
    navigate(term ? `${paths.search}?q=${encodeURIComponent(term)}` : paths.search);
  }

  return (
    <header className="glass-panel sticky top-0 z-40 border-b border-line">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open navigation"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-silver transition-colors hover:border-lime/50 hover:text-lime lg:hidden"
        >
          <Menu size={18} aria-hidden="true" />
        </button>

        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Workspace</p>
          <p className="truncate text-sm font-semibold text-ink">{pageTitleFor(location.pathname)}</p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <SearchInput
            value={query}
            onChange={setQuery}
            onSubmit={submit}
            placeholder="Search FusionV"
            className="hidden w-52 md:block lg:w-72"
          />

          <Link
            to={paths.search}
            aria-label="Search"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-silver transition-colors hover:border-lime/50 hover:text-lime md:hidden"
          >
            <Search size={17} aria-hidden="true" />
          </Link>

          <Link
            to={paths.notifications}
            aria-label={
              unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'
            }
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-silver transition-colors hover:border-lime/50 hover:text-lime"
          >
            <Bell size={17} aria-hidden="true" />
            {unreadCount ? (
              <span
                aria-hidden="true"
                className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-lime px-1 text-[10px] font-bold text-background"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            ) : null}
          </Link>

          <UserMenu />
        </div>
      </div>
    </header>
  );
}
