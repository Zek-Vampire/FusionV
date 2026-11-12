import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Badge as BadgeIcon,
  CalendarDays,
  FolderOpen,
  GraduationCap,
  Lock,
  Search,
  Users,
} from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { ButtonLink } from '@/components/ui/Button';
import PageHeader from '@/components/public/PageHeader';
import { EmptyState, Skeleton } from '@/components/ui/States';
import { useAuth } from '@/context/AuthContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import {
  categoryLabel,
  fileSize,
  formatDateRange,
  formatNumber,
} from '@/lib/format';
import { hackathonStatus } from '@/lib/hackathonStatus';
import { queryKeys } from '@/lib/queryKeys';
import { listHackathons } from '@/services/hackathons';
import { listResources } from '@/services/resources';
import { searchTeams } from '@/services/teams';
import { searchStudents } from '@/services/users';
import { paths } from '@/routes/paths';

function CategorySection({
  title,
  icon: Icon,
  query,
  locked = false,
  lockedText,
  loginHref,
  viewAllHref,
  viewAllLabel,
  emptyText,
  children,
}) {
  const count =
    !query.isPending && !query.isError && Array.isArray(query.data) ? query.data.length : null;

  return (
    <section className="flex flex-col rounded-panel border border-line bg-surface p-5">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-lime/20 bg-lime/[0.07] text-lime">
          <Icon size={15} aria-hidden="true" />
        </span>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {!locked && count !== null ? (
          <Badge variant="outline" className="ml-auto">
            {count}
          </Badge>
        ) : null}
      </div>

      {locked ? (
        <div className="mt-4 flex flex-1 flex-col justify-between gap-4 rounded-xl border border-dashed border-line bg-background/40 p-4">
          <div className="flex items-start gap-2 text-sm text-muted">
            <Lock size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
            <p>{lockedText}</p>
          </div>
          <Link
            to={loginHref}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-lime hover:underline"
          >
            Log in to continue
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      ) : query.isPending ? (
        <div className="mt-4 space-y-2.5" role="status" aria-label={`Searching ${title.toLowerCase()}`}>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-2/3" />
        </div>
      ) : query.isError ? (
        <div className="mt-4 rounded-xl border border-red-400/25 bg-red-400/[0.06] p-3 text-sm text-red-200">
          <p>{query.error?.message || `Could not search ${title.toLowerCase()}.`}</p>
          <button
            type="button"
            onClick={() => query.refetch()}
            className="mt-2 text-xs font-semibold text-red-200 underline hover:text-red-100"
          >
            Retry
          </button>
        </div>
      ) : count === 0 ? (
        <p className="mt-4 text-sm text-muted">{emptyText}</p>
      ) : (
        <>
          <div className="mt-3 flex-1">{children}</div>
          {viewAllHref ? (
            <Link
              to={viewAllHref}
              className="mt-4 inline-flex items-center gap-1.5 border-t border-line pt-3 text-xs font-semibold text-silver transition-colors hover:text-lime"
            >
              {viewAllLabel} ({count})
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
          ) : null}
        </>
      )}
    </section>
  );
}

function ResultLink({ to, children }) {
  return (
    <li>
      <Link
        to={to}
        className="flex items-start justify-between gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-elevated/70"
      >
        {children}
      </Link>
    </li>
  );
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = (searchParams.get('q') || '').trim();
  const { isAuthenticated } = useAuth();
  const [term, setTerm] = useState(q);
  usePageTitle(q ? `Search: ${q}` : 'Search');

  useEffect(() => {
    setTerm(q);
  }, [q]);

  const enabled = Boolean(q);

  const hackathons = useQuery({
    queryKey: queryKeys.hackathons.list({}),
    queryFn: () => listHackathons(),
    enabled,
  });

  const resources = useQuery({
    queryKey: queryKeys.resources.list({ q }),
    queryFn: () => listResources({ q }),
    enabled,
  });

  const teams = useQuery({
    queryKey: queryKeys.search.teams(q),
    queryFn: () => searchTeams({ q }),
    enabled: enabled && isAuthenticated,
  });

  const students = useQuery({
    queryKey: queryKeys.search.students(q),
    queryFn: () => searchStudents({ q }),
    enabled: enabled && isAuthenticated,
  });

  const lower = q.toLowerCase();
  const hackathonMatches =
    hackathons.data?.filter((item) =>
      [item.name, item.organizer, item.domain, item.location, item.description, item.eligibility]
        .join(' ')
        .toLowerCase()
        .includes(lower),
    ) ?? [];

  const searchPath = `${paths.search}?q=${encodeURIComponent(q)}`;
  const loginHref = `${paths.login}?next=${encodeURIComponent(searchPath)}`;

  function submit(event) {
    event.preventDefault();
    const value = term.trim();
    setSearchParams(value ? { q: value } : {});
  }

  return (
    <div>
      <PageHeader
        eyebrow="Search"
        title="Search FusionV"
        description="Results are grouped by category and come directly from the corresponding API. Public categories work without an account."
      />

      <form
        role="search"
        className="mt-6 flex flex-col gap-2 rounded-panel border border-line bg-surface p-3 sm:flex-row"
        onSubmit={submit}
      >
        <label htmlFor="global-search" className="sr-only">
          Search hackathons, resources, teams and students
        </label>
        <div className="relative flex-1">
          <Search
            size={17}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            id="global-search"
            name="q"
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Hackathons, resources, teams, students…"
            className="h-11 w-full rounded-xl border border-line bg-background/60 pl-10 pr-4 text-sm text-ink placeholder:text-muted/70 focus:border-lime/60 focus:outline-none focus:ring-2 focus:ring-lime/20"
          />
        </div>
        <Button type="submit" className="sm:w-auto">
          Search
        </Button>
      </form>

      {!q ? (
        <EmptyState
          className="mt-6"
          icon={Search}
          title="Search the whole platform"
          description="Public categories — hackathons and resources — work without an account. Teams and students need a login because the backend protects those records."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <ButtonLink to={paths.hackathons}>Browse hackathons</ButtonLink>
              <ButtonLink to={paths.resources} variant="outline">
                Browse resources
              </ButtonLink>
            </div>
          }
        />
      ) : (
        <>
          <p className="mt-5 text-sm text-muted" role="status" aria-live="polite">
            Showing results for <strong className="text-ink">“{q}”</strong>.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <CategorySection
              title="Hackathons"
              icon={CalendarDays}
              query={{ ...hackathons, data: hackathonMatches }}
              viewAllHref={`${paths.hackathons}?q=${encodeURIComponent(q)}`}
              viewAllLabel="View all hackathons"
              emptyText="No hackathons match this search."
            >
              <ul className="divide-y divide-line">
                {hackathonMatches.slice(0, 3).map((item) => {
                  const status = hackathonStatus(item);
                  return (
                    <ResultLink key={item.id} to={paths.hackathon(item.id)}>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-ink">
                          {item.name}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted">
                          {item.organizer || 'Organizer not listed'} ·{' '}
                          {formatDateRange(item.startDate, item.endDate) || 'Dates not listed'}
                        </span>
                      </span>
                      <Badge
                        variant={
                          status.registration === 'open'
                            ? 'success'
                            : status.registration === 'today'
                              ? 'warning'
                              : 'neutral'
                        }
                        className="shrink-0"
                      >
                        {status.registrationLabel}
                      </Badge>
                    </ResultLink>
                  );
                })}
              </ul>
            </CategorySection>

            <CategorySection
              title="Resources"
              icon={FolderOpen}
              query={resources}
              viewAllHref={`${paths.resources}?q=${encodeURIComponent(q)}`}
              viewAllLabel="View all resources"
              emptyText="No resources match this search."
            >
              <ul className="divide-y divide-line">
                {resources.data?.slice(0, 3).map((item) => (
                  <ResultLink key={item.id} to={paths.resource(item.id)}>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-ink">
                        {item.title}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted">
                        {item.uploaderName} · {categoryLabel(item.category)} · {fileSize(item.sizeBytes)}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-muted">
                      {formatNumber(item.downloadCount)} downloads
                    </span>
                  </ResultLink>
                ))}
              </ul>
            </CategorySection>

            <CategorySection
              title="Teams"
              icon={Users}
              query={teams}
              locked={!isAuthenticated}
              lockedText="Team records are protected by the backend, so team search needs an account."
              loginHref={loginHref}
              viewAllHref={`${paths.teams}?q=${encodeURIComponent(q)}`}
              viewAllLabel="View all teams"
              emptyText="No teams match this search."
            >
              <ul className="divide-y divide-line">
                {teams.data?.slice(0, 3).map((team) => (
                  <ResultLink key={team.id} to={paths.team(team.id)}>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-ink">
                        {team.name}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted">
                        {team.hackathonName || 'No hackathon linked'} · {team.memberCount}/
                        {team.maxMembers} members
                      </span>
                    </span>
                    <Badge
                      variant={team.memberCount >= team.maxMembers ? 'neutral' : 'success'}
                      className="shrink-0"
                    >
                      {team.memberCount >= team.maxMembers ? 'Full' : 'Open'}
                    </Badge>
                  </ResultLink>
                ))}
              </ul>
            </CategorySection>

            <CategorySection
              title="Students"
              icon={GraduationCap}
              query={students}
              locked={!isAuthenticated}
              lockedText="Student search is protected by the backend, so finding students needs an account."
              loginHref={loginHref}
              viewAllHref={`${paths.students}?q=${encodeURIComponent(q)}`}
              viewAllLabel="View all students"
              emptyText="No students match this search."
            >
              <ul className="divide-y divide-line">
                {students.data?.slice(0, 3).map((student) => (
                  <ResultLink key={student.id} to={paths.student(student.id)}>
                    <span className="flex min-w-0 items-center gap-2.5">
                      <Avatar name={student.fullName} size="sm" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-ink">
                          {student.fullName}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted">
                          {[student.yearBranch, student.college].filter(Boolean).join(' · ') ||
                            'Profile details not added'}
                        </span>
                      </span>
                    </span>
                    {student.skills?.[0] ? (
                      <Badge variant="neutral" className="shrink-0">
                        <BadgeIcon size={10} aria-hidden="true" />
                        {student.skills[0]}
                      </Badge>
                    ) : null}
                  </ResultLink>
                ))}
              </ul>
            </CategorySection>
          </div>

          <p className="mt-5 flex items-start gap-2 text-xs text-muted">
            <Search size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            Open a category page to narrow the results with its full filter set.
          </p>
        </>
      )}
    </div>
  );
}
