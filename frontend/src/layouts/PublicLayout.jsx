import { lazy, Suspense, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { LogIn, Menu, UserPlus } from 'lucide-react';
import BackgroundFX from '@/components/common/BackgroundFX';
import BrandLogo from '@/components/BrandLogo';
import PageTransition from '@/components/motion/PageTransition';
import { publicNav, publicNavigationGroups } from '@/components/navigation/navItems';
import { ButtonLink } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useSignOut } from '@/hooks/useSignOut';
import { cn } from '@/lib/cn';
import { paths } from '@/routes/paths';

const MobileNav = lazy(() => import('@/components/navigation/MobileNav'));

export default function PublicLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navReady, setNavReady] = useState(false);
  const { isAuthenticated } = useAuth();
  const signOut = useSignOut();

  const mobileFooter = isAuthenticated ? (
    <div className="space-y-2">
      <ButtonLink to={paths.dashboard} className="w-full" onClick={() => setMobileOpen(false)}>
        Open workspace
      </ButtonLink>
      <button
        type="button"
        onClick={() => {
          setMobileOpen(false);
          signOut();
        }}
        className="w-full rounded-xl px-3 py-2 text-sm text-muted transition-colors hover:text-lime"
      >
        Log out
      </button>
    </div>
  ) : (
    <div className="space-y-2">
      <ButtonLink to={paths.login} className="w-full" onClick={() => setMobileOpen(false)}>
        Log in
      </ButtonLink>
      <ButtonLink
        to={paths.signup}
        variant="outline"
        className="w-full"
        onClick={() => setMobileOpen(false)}
      >
        Sign up
      </ButtonLink>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <BackgroundFX />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[300] focus:rounded-lg focus:bg-lime focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-background"
      >
        Skip to content
      </a>

      <header className="glass-panel sticky top-0 z-40 border-b border-line">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6">
          <Link to={paths.home} aria-label="FusionV home" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime">
            <BrandLogo imageClassName="h-9 w-9" textClassName="text-lg" />
          </Link>

          <nav aria-label="Public" className="ml-6 hidden items-center gap-1 md:flex">
            {publicNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2 text-sm transition-colors',
                    isActive ? 'bg-elevated text-lime' : 'text-silver hover:bg-elevated/70 hover:text-ink',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {isAuthenticated ? (
              <ButtonLink to={paths.dashboard} size="sm" className="hidden sm:inline-flex">
                Open workspace
              </ButtonLink>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <ButtonLink to={paths.login} variant="ghost" size="sm" icon={LogIn}>
                  Log in
                </ButtonLink>
                <ButtonLink to={paths.signup} size="sm" icon={UserPlus}>
                  Sign up
                </ButtonLink>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setNavReady(true);
                setMobileOpen(true);
              }}
              aria-label="Open navigation"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-silver transition-colors hover:border-lime/50 hover:text-lime md:hidden"
            >
              <Menu size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6">
        <PageTransition />
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>FusionV · React frontend</p>
          <div className="flex flex-wrap gap-4">
            <Link to={paths.hackathons} className="transition-colors hover:text-lime">
              Hackathons
            </Link>
            <Link to={paths.resources} className="transition-colors hover:text-lime">
              Resources
            </Link>
            <Link to={paths.search} className="transition-colors hover:text-lime">
              Search
            </Link>
            <Link to={paths.designSystem} className="transition-colors hover:text-lime">
              Design system
            </Link>
          </div>
        </div>
      </footer>

      {navReady ? (
        <Suspense fallback={null}>
          <MobileNav
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            groups={publicNavigationGroups}
            title="Public navigation"
            footer={mobileFooter}
          />
        </Suspense>
      ) : null}
    </div>
  );
}
