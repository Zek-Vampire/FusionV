import { Link, Outlet } from 'react-router-dom';
import { CalendarDays, FolderOpen, Trophy, Users } from 'lucide-react';
import BackgroundFX from '@/components/common/BackgroundFX';
import PageTransition from '@/components/motion/PageTransition';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { paths } from '@/routes/paths';

const FEATURES = [
  { icon: Users, label: 'Find teammates' },
  { icon: CalendarDays, label: 'Explore hackathons' },
  { icon: FolderOpen, label: 'Share resources' },
  { icon: Trophy, label: 'Showcase achievements' },
];

export default function AuthLayout() {
  return (
    <div className="relative min-h-screen lg:grid lg:grid-cols-[1.02fr_0.98fr]">
      <BackgroundFX />

      <aside className="relative hidden flex-col justify-between border-r border-line bg-surface/40 p-10 lg:flex xl:p-14">
        <Link to={paths.home} className="inline-flex items-baseline gap-1 text-2xl font-bold tracking-tight">
          <span className="text-gradient">Fusion</span>
          <span className="text-lime">V</span>
        </Link>

        <div className="max-w-md">
          <Badge variant="lime" dot>
            Students × ideas × opportunities
          </Badge>
          <h2 className="mt-5 text-4xl font-bold leading-[1.08] tracking-tight xl:text-5xl">
            Build teams.
            <br />
            Join hackathons.
            <br />
            <span className="text-gradient">Grow together.</span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-silver">
            Connect with students who complement your skills, discover real events and share what
            you learn.
          </p>

          <ul className="mt-8 grid grid-cols-2 gap-3">
            {FEATURES.map((item) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.label}
                  className="flex items-center gap-2.5 rounded-xl border border-line bg-background/40 p-3 text-xs text-silver"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-lime/20 bg-lime/[0.07] text-lime">
                    <Icon size={14} aria-hidden="true" />
                  </span>
                  {item.label}
                </li>
              );
            })}
          </ul>
        </div>

        <p className="max-w-sm border-l-2 border-lime/40 pl-4 text-sm italic text-muted">
          “Great things happen when students build together.”
        </p>
      </aside>

      <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:px-6">
        <Link
          to={paths.home}
          className="inline-flex items-baseline gap-1 text-2xl font-bold tracking-tight lg:hidden"
        >
          <span className="text-gradient">Fusion</span>
          <span className="text-lime">V</span>
        </Link>

        <div className="mt-8 w-full max-w-md">
          <Card interactive className="w-full">
            <div className="p-6 sm:p-8">
              <PageTransition />
            </div>
          </Card>

          <p className="mt-5 text-center text-xs text-muted">
            <Link to={paths.home} className="transition-colors hover:text-lime">
              ← Back to the public site
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
