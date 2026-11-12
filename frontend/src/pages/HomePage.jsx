import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  CalendarDays,
  FolderOpen,
  GraduationCap,
  Layers,
  Lock,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react';
import { Reveal, Stagger, StaggerItem } from '@/components/motion/Reveal';
import Badge from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorState, Skeleton } from '@/components/ui/States';
import { useAuth } from '@/context/AuthContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { formatNumber } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { paths } from '@/routes/paths';
import { getPublicStats } from '@/services/public';

const STAT_DEFS = [
  { key: 'students', label: 'Students', icon: GraduationCap, to: paths.students, locked: true },
  { key: 'hackathons', label: 'Hackathons', icon: CalendarDays, to: paths.hackathons },
  { key: 'teams', label: 'Teams', icon: Users, to: paths.teams, locked: true },
  { key: 'resources', label: 'Resources', icon: FolderOpen, to: paths.resources },
  { key: 'posts', label: 'Community posts', icon: Layers, to: paths.community, locked: true },
];

function gatedPath(to, locked, isAuthenticated) {
  if (!locked || isAuthenticated) return to;
  return `${paths.login}?next=${encodeURIComponent(to)}`;
}

export default function HomePage() {
  usePageTitle('Students build together');
  const { isAuthenticated } = useAuth();
  const stats = useQuery({
    queryKey: queryKeys.public.stats,
    queryFn: getPublicStats,
    staleTime: 60_000,
  });

  return (
    <div className="space-y-16 sm:space-y-20">
      <section
        aria-labelledby="hero-title"
        className="relative overflow-hidden rounded-panel border border-line bg-surface/70"
      >
        <div className="grid lg:grid-cols-[1.08fr_0.92fr]">
          <div className="relative z-10 p-6 sm:p-10 lg:p-12">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="lime" dot>
                Student collaboration platform
              </Badge>
              <Badge variant="outline">Public discovery · no account needed</Badge>
            </div>

            <h1
              id="hero-title"
              className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl"
            >
              Build teams.
              <br />
              Join hackathons.
              <br />
              <span className="text-gradient">Grow together.</span>
            </h1>

            <p className="hero-blur-in mt-5 max-w-xl text-base text-silver sm:text-lg">
              Discover real events, share study material and find the people who complete your
              team — all in one student workspace.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              {isAuthenticated ? (
                <ButtonLink to={paths.dashboard} size="lg" iconRight={ArrowRight}>
                  Open workspace
                </ButtonLink>
              ) : (
                <ButtonLink to={paths.signup} size="lg" iconRight={ArrowRight}>
                  Get started
                </ButtonLink>
              )}
              <ButtonLink to={paths.hackathons} variant="outline" size="lg">
                Explore hackathons
              </ButtonLink>
            </div>

            <p className="mt-5 flex items-start gap-2 text-xs text-muted">
              <ShieldCheck size={15} className="mt-px shrink-0 text-lime/80" aria-hidden="true" />
              Public hackathons and resources are visible without an account. Teams, students and
              community features require signing in.
            </p>
          </div>

          <div className="relative flex items-stretch border-t border-line p-4 sm:p-6 lg:border-l lg:border-t-0">
            <Card interactive className="w-full">
              <div className="flex h-full flex-col p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                  <span className="inline-flex items-center gap-2">
                    <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-lime" />
                    The FusionV community
                  </span>
                  <span>01 — 03</span>
                </div>

                <div className="mt-8">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-lime">
                    Good things happen together
                  </p>
                  <p className="mt-2 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
                    Build something
                    <span className="block text-gradient">better, together.</span>
                  </p>
                  <p className="mt-2 max-w-sm text-sm text-muted">
                    Bring your ideas, find your people, and turn a spark into something real.
                  </p>
                </div>

                <ol className="mt-auto grid gap-2 pt-8">
                  {[
                    { icon: Users, step: '01 / Connect', title: 'Find your people', text: 'Skills meet ambition.' },
                    { icon: Sparkles, step: '02 / Create', title: 'Build as a team', text: 'Good ideas take shape.' },
                    { icon: Trophy, step: '03 / Share', title: 'Make an impact', text: 'Show what you made.' },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <li
                        key={item.step}
                        className="flex items-center gap-3 rounded-xl border border-line/70 bg-background/40 p-3"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-lime/25 bg-lime/10 text-lime">
                          <Icon size={16} aria-hidden="true" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                            {item.step}
                          </span>
                          <span className="block text-sm font-semibold text-ink">{item.title}</span>
                          <span className="block text-xs text-muted">{item.text}</span>
                        </span>
                      </li>
                    );
                  })}
                </ol>

                <p className="mt-5 border-t border-line pt-3 text-[11px] text-muted">
                  One community. Infinite possibilities.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section aria-labelledby="stats-title">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-lime">Live totals</p>
            <h2 id="stats-title" className="mt-1 text-2xl font-bold tracking-tight">
              The community, in real numbers
            </h2>
            <p className="mt-1 text-sm text-muted">
              Read from this FusionV database. No estimates, samples or placeholder counts.
            </p>
          </div>
        </div>

        {stats.isPending ? (
          <div
            role="status"
            aria-label="Loading community totals"
            className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
          >
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="rounded-panel border border-line bg-surface p-4">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="mt-4 h-7 w-16" />
                <Skeleton className="mt-2 h-3 w-20" />
              </div>
            ))}
          </div>
        ) : stats.isError ? (
          <ErrorState
            className="mt-5"
            title="Community totals are unavailable right now"
            message={stats.error?.message}
            onRetry={() => stats.refetch()}
            retryLabel="Reload totals"
          />
        ) : (
          <Stagger className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {STAT_DEFS.map((item) => {
              const Icon = item.icon;
              const value = stats.data?.[item.key] ?? 0;
              return (
                <StaggerItem key={item.key}>
                  <Link
                    to={gatedPath(item.to, item.locked, isAuthenticated)}
                    className="group flex h-full flex-col rounded-panel border border-line bg-surface p-4 transition-colors hover:border-lime/50 hover:bg-elevated/60"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-lime/20 bg-lime/[0.07] text-lime">
                      <Icon size={16} aria-hidden="true" />
                    </span>
                    <span className="mt-4 text-2xl font-bold tracking-tight text-ink">
                      {formatNumber(value)}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                      {item.label}
                      {item.locked && !isAuthenticated ? (
                        <Lock size={11} aria-label="requires an account" />
                      ) : null}
                    </span>
                  </Link>
                </StaggerItem>
              );
            })}
          </Stagger>
        )}

        {stats.isSuccess && stats.data?.students === 0 ? (
          <p className="mt-3 text-xs text-muted">
            FusionV is just getting started — these totals are real, not sample data.
          </p>
        ) : null}
      </section>

      <section aria-labelledby="features-title">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-lime">
              What you can do
            </p>
            <h2 id="features-title" className="mt-1 text-2xl font-bold tracking-tight">
              One place for the whole student journey
            </h2>
          </div>
          <ButtonLink to={paths.hackathons} variant="ghost" size="sm" iconRight={ArrowRight}>
            Browse opportunities
          </ButtonLink>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {[
            {
              icon: CalendarDays,
              title: 'Discover hackathons',
              description:
                'Search real events by mode, domain, location and dates. Registration and event status are computed from the published calendar dates.',
              to: paths.hackathons,
              cta: 'Explore events',
            },
            {
              icon: FolderOpen,
              title: 'Share resources',
              description:
                'Find notes and question papers uploaded by other students, then download the original file with its real filename.',
              to: paths.resources,
              cta: 'Open the library',
            },
            {
              icon: GraduationCap,
              title: 'Find teammates',
              description:
                'Search student profiles by skill and interest, then build a team around the missing pieces.',
              to: paths.students,
              cta: 'Find students',
              locked: true,
            },
            {
              icon: Trophy,
              title: 'Show your work',
              description:
                'Publish structured projects and achievements, not just plain text updates, and keep the story with your profile.',
              to: paths.community,
              cta: 'See the community',
              locked: true,
            },
          ].map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Reveal key={feature.title} delay={index * 0.06}>
                <Card className="h-full transition-colors hover:border-lime/35">
                  <div className="flex h-full flex-col p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-lime/25 bg-lime/10 text-lime">
                        <Icon size={18} aria-hidden="true" />
                      </span>
                      {feature.locked ? (
                        <Badge variant="outline" className="gap-1">
                          <Lock size={10} aria-hidden="true" />
                          Account required
                        </Badge>
                      ) : null}
                    </div>
                    <h3 className="mt-4 text-lg font-semibold tracking-tight">{feature.title}</h3>
                    <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted">
                      {feature.description}
                    </p>
                    <Link
                      to={gatedPath(feature.to, feature.locked, isAuthenticated)}
                      className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-lime transition-opacity hover:opacity-80"
                    >
                      {feature.cta}
                      <ArrowRight size={15} aria-hidden="true" />
                    </Link>
                  </div>
                </Card>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="how-title" className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="rounded-panel border border-line bg-surface p-6 sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-lime">How it works</p>
          <h2 id="how-title" className="mt-1 text-2xl font-bold tracking-tight">
            From a spark to something real
          </h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              { step: '1', title: 'Build your profile', text: 'Add your skills, interests and links.' },
              { step: '2', title: 'Explore & connect', text: 'Find events, teams and students.' },
              { step: '3', title: 'Build together', text: 'Invite teammates and chat in your team.' },
              { step: '4', title: 'Share the result', text: 'Post the project and the achievement.' },
            ].map((item) => (
              <li key={item.step} className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-lime/30 bg-lime/10 text-xs font-bold text-lime">
                  {item.step}
                </span>
                <div>
                  <h3 className="text-sm font-semibold">{item.title}</h3>
                  <p className="mt-0.5 text-sm text-muted">{item.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex flex-col justify-between rounded-panel border border-lime/25 bg-lime/[0.06] p-6 sm:p-8">
          <div>
            <Badge variant="lime" dot>
              Open to every student
            </Badge>
            <p className="mt-5 text-2xl font-semibold leading-tight tracking-tight">
              Same passion.
              <span className="block text-gradient">Bigger possibilities.</span>
            </p>
            <p className="mt-2 text-sm text-muted">
              Create an account to unlock teams, student discovery and the community feed.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {isAuthenticated ? (
              <ButtonLink to={paths.dashboard} iconRight={ArrowRight}>
                Open workspace
              </ButtonLink>
            ) : (
              <>
                <ButtonLink to={paths.signup} iconRight={ArrowRight}>
                  Join FusionV
                </ButtonLink>
                <ButtonLink to={paths.login} variant="outline">
                  Log in
                </ButtonLink>
              </>
            )}
          </div>
        </div>
      </section>

      <section aria-labelledby="search-cta" className="rounded-panel border border-line bg-surface p-6 text-center sm:p-10">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-lime/25 bg-lime/10 text-lime">
          <Search size={19} aria-hidden="true" />
        </div>
        <h2 id="search-cta" className="mt-4 text-2xl font-bold tracking-tight">
          Not sure where to start?
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted">
          Search across public hackathons and resources. Sign in to include teams and student
          profiles, which the backend protects.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <ButtonLink to={paths.search} iconRight={ArrowRight}>
            Search FusionV
          </ButtonLink>
          <ButtonLink to={paths.resources} variant="outline">
            Browse resources
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
