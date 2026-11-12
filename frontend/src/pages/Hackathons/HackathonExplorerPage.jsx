import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { CalendarDays, Filter, RotateCcw, Search, Users } from 'lucide-react';
import HackathonCard from '@/components/cards/HackathonCard';
import PageHeader from '@/components/public/PageHeader';
import { ButtonLink } from '@/components/ui/Button';
import Button from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/FormControls';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { useAuth } from '@/context/AuthContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { hackathonStatus } from '@/lib/hackathonStatus';
import { todayISO } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { listHackathons } from '@/services/hackathons';
import { paths } from '@/routes/paths';

const EMPTY_FORM = {
  q: '',
  mode: '',
  domain: '',
  location: '',
  reg: '',
  event: '',
  sort: 'deadline',
};

const MODE_OPTIONS = [
  ['', 'Any mode'],
  ['ONLINE', 'Online'],
  ['OFFLINE', 'In person'],
  ['HYBRID', 'Hybrid'],
];

const REGISTRATION_OPTIONS = [
  ['', 'Any registration state'],
  ['open', 'Registration open'],
  ['closed', 'Registration closed'],
  ['unknown', 'No deadline listed'],
];

const EVENT_OPTIONS = [
  ['', 'Any event status'],
  ['upcoming', 'Upcoming'],
  ['ongoing', 'Happening now'],
  ['past', 'Completed'],
];

const SORT_OPTIONS = [
  ['deadline', 'Registration deadline'],
  ['start', 'Start date'],
  ['name', 'Name (A–Z)'],
];

function formFromParams(searchParams) {
  return {
    q: searchParams.get('q') || '',
    mode: searchParams.get('mode') || '',
    domain: searchParams.get('domain') || '',
    location: searchParams.get('location') || '',
    reg: searchParams.get('reg') || '',
    event: searchParams.get('event') || '',
    sort: searchParams.get('sort') || 'deadline',
  };
}

function sortHackathons(list, sort) {
  return list.slice().sort((a, b) => {
    if (sort === 'name') return String(a.name || '').localeCompare(String(b.name || ''));
    if (sort === 'start') {
      return (
        (a.startDate || '9999').localeCompare(b.startDate || '9999') ||
        String(a.name).localeCompare(String(b.name))
      );
    }
    return (
      (a.registrationDeadline || '9999').localeCompare(b.registrationDeadline || '9999') ||
      String(a.name).localeCompare(String(b.name))
    );
  });
}

function matchesStatus(hackathon, registrationFilter, eventFilter, today) {
  const status = hackathonStatus(hackathon, today);
  if (registrationFilter === 'open' && status.registration !== 'open' && status.registration !== 'today') {
    return false;
  }
  if (registrationFilter === 'closed' && status.registration !== 'closed') return false;
  if (registrationFilter === 'unknown' && status.registration !== 'unknown') return false;
  if (eventFilter && status.event !== eventFilter) return false;
  return true;
}

export default function HackathonExplorerPage() {
  usePageTitle('Hackathons');
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const paramString = searchParams.toString();
  const [form, setForm] = useState(() => formFromParams(searchParams));
  const [visibleCount, setVisibleCount] = useState(9);

  useEffect(() => {
    setForm(formFromParams(searchParams));
    setVisibleCount(9);
    // formFromParams reads the URL, which is the single source of truth.
  }, [paramString, searchParams]);

  const serverFilters = useMemo(
    () => ({
      name: searchParams.get('q') || '',
      mode: searchParams.get('mode') || '',
      domain: searchParams.get('domain') || '',
      location: searchParams.get('location') || '',
    }),
    [paramString, searchParams],
  );

  const hackathons = useQuery({
    queryKey: queryKeys.hackathons.list(serverFilters),
    queryFn: () => listHackathons(serverFilters),
  });

  const registrationFilter = searchParams.get('reg') || '';
  const eventFilter = searchParams.get('event') || '';
  const sort = searchParams.get('sort') || 'deadline';

  const filtered = useMemo(() => {
    const today = todayISO();
    const list = Array.isArray(hackathons.data) ? hackathons.data : [];
    return sortHackathons(
      list.filter((hackathon) => matchesStatus(hackathon, registrationFilter, eventFilter, today)),
      sort,
    );
  }, [hackathons.data, registrationFilter, eventFilter, sort]);

  const shown = filtered.slice(0, visibleCount);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function applyFilters(overrides = {}) {
    const values = { ...form, ...overrides };
    const next = new URLSearchParams();
    const add = (key, value) => {
      if (value) next.set(key, String(value).trim());
    };
    add('q', values.q);
    add('mode', values.mode);
    add('domain', values.domain);
    add('location', values.location);
    add('reg', values.reg);
    add('event', values.event);
    if (values.sort && values.sort !== 'deadline') next.set('sort', values.sort);
    setSearchParams(next);
  }

  function clearFilters() {
    setForm(EMPTY_FORM);
    setSearchParams({});
  }

  const hasFilters = Boolean(paramString);

  return (
    <div>
      <PageHeader
        eyebrow="Discover"
        title="Hackathons"
        description="Real events from the FusionV database. Search, filter and open details without an account."
        actions={
          isAuthenticated ? (
            <ButtonLink to={paths.teams} variant="outline" icon={Users}>
              Find teammates
            </ButtonLink>
          ) : (
            <ButtonLink
              to={`${paths.login}?next=${encodeURIComponent(paths.teams)}`}
              variant="outline"
              icon={Users}
            >
              Log in to find teammates
            </ButtonLink>
          )
        }
      />

      <form
        role="search"
        aria-label="Filter hackathons"
        className="mt-6 rounded-panel border border-line bg-surface p-4 sm:p-5"
        onSubmit={(event) => {
          event.preventDefault();
          applyFilters();
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            containerClassName="sm:col-span-2"
            label="Search events"
            name="q"
            type="search"
            placeholder="Name, organizer, domain, location or description"
            value={form.q}
            onChange={(event) => updateField('q', event.target.value)}
          />
          <Select label="Mode" name="mode" value={form.mode} onChange={(event) => updateField('mode', event.target.value)}>
            {MODE_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Input
            label="Domain"
            name="domain"
            placeholder="e.g. AI/ML"
            value={form.domain}
            onChange={(event) => updateField('domain', event.target.value)}
          />
          <Input
            label="Location"
            name="location"
            placeholder="e.g. Bengaluru or Online"
            value={form.location}
            onChange={(event) => updateField('location', event.target.value)}
          />
          <Select label="Registration" name="reg" value={form.reg} onChange={(event) => updateField('reg', event.target.value)}>
            {REGISTRATION_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Select label="Event status" name="event" value={form.event} onChange={(event) => updateField('event', event.target.value)}>
            {EVENT_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Select
            label="Sort by"
            name="sort"
            value={form.sort}
            onChange={(event) => {
              updateField('sort', event.target.value);
              applyFilters({ sort: event.target.value });
            }}
          >
            {SORT_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <Button type="submit" icon={Filter}>
            Apply filters
          </Button>
          <Button type="button" variant="ghost" icon={RotateCcw} onClick={clearFilters} disabled={!hasFilters}>
            Clear all
          </Button>
          <span className="ml-auto text-xs text-muted">
            Registration and event status are calculated from published dates using your device’s
            local date.
          </span>
        </div>
      </form>

      <div className="mt-6" role="status" aria-live="polite">
        {hackathons.isSuccess ? (
          <p className="text-sm text-muted">
            <strong className="text-ink">{filtered.length}</strong>{' '}
            {filtered.length === 1 ? 'event' : 'events'}
            {hasFilters ? ' matching your filters' : ' in the database'}.
          </p>
        ) : null}
      </div>

      {hackathons.isPending ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Loading hackathons">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="rounded-panel border border-line bg-surface p-5">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="mt-4 h-6 w-3/4" />
              <Skeleton className="mt-2 h-4 w-1/2" />
              <Skeleton className="mt-5 h-3 w-full" />
              <Skeleton className="mt-2 h-3 w-full" />
              <Skeleton className="mt-2 h-3 w-2/3" />
            </div>
          ))}
        </div>
      ) : hackathons.isError ? (
        <ErrorState
          className="mt-4"
          title="Hackathons could not be loaded"
          message={hackathons.error?.message}
          onRetry={() => hackathons.refetch()}
          retryLabel="Reload hackathons"
        />
      ) : filtered.length === 0 ? (
        hasFilters ? (
          <EmptyState
            className="mt-4"
            icon={Search}
            title="No events match these filters"
            description="Try a broader search, a different mode or clear the filters."
            action={<Button onClick={clearFilters}>Clear filters</Button>}
          />
        ) : (
          <EmptyState
            className="mt-4"
            icon={CalendarDays}
            title="No hackathons have been added yet"
            description="FusionV does not invent events. Hackathons appear here after an administrator adds or imports them."
            action={<ButtonLink to={paths.resources} variant="outline">Browse shared resources</ButtonLink>}
          />
        )
      ) : (
        <>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {shown.map((hackathon) => (
              <HackathonCard key={hackathon.id} hackathon={hackathon} />
            ))}
          </div>
          {filtered.length > shown.length ? (
            <div className="mt-6 text-center">
              <Button variant="outline" onClick={() => setVisibleCount((count) => count + 9)}>
                Load more events ({filtered.length - shown.length} remaining)
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
