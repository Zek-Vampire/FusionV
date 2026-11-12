import { lazy, Suspense, useState } from 'react';
import { LogOut } from 'lucide-react';
import BackgroundFX from '@/components/common/BackgroundFX';
import PageTransition from '@/components/motion/PageTransition';
import Sidebar from '@/components/navigation/Sidebar';
import Topbar from '@/components/navigation/Topbar';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useSignOut } from '@/hooks/useSignOut';

const MobileNav = lazy(() => import('@/components/navigation/MobileNav'));

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navReady, setNavReady] = useState(false);
  const { user } = useAuth();
  const signOut = useSignOut();

  const mobileFooter = (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Avatar name={user?.fullName} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{user?.fullName || 'Signed in'}</p>
          <p className="truncate text-xs text-muted">{user?.email || 'FusionV account'}</p>
        </div>
      </div>
      <Button variant="outline" size="sm" icon={LogOut} onClick={signOut} className="w-full">
        Log out
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen">
      <BackgroundFX />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[300] focus:rounded-lg focus:bg-lime focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-background"
      >
        Skip to content
      </a>

      <Sidebar />

      <div className="lg:pl-72">
        <Topbar
          onOpenMenu={() => {
            setNavReady(true);
            setMobileOpen(true);
          }}
        />
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
        >
          <PageTransition />
        </main>
      </div>

      {navReady ? (
        <Suspense fallback={null}>
          <MobileNav
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            title="Workspace navigation"
            footer={mobileFooter}
          />
        </Suspense>
      ) : null}
    </div>
  );
}
