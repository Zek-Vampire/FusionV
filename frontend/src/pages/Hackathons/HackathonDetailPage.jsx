import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Clock,
  Globe2,
  Info,
  Lock,
  MapPin,
  Users,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { ButtonLink, buttonClasses } from '@/components/ui/Button';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { useAuth } from '@/context/AuthContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import { eventTone, hackathonStatus, registrationTone } from '@/lib/hackathonStatus';
import { formatDate, formatDateRange, modeLabel } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { safeHttpUrl } from '@/lib/validation';
import { getHackathon } from '@/services/hackathons';
import { paths } from '@/routes/paths';

function DetailSkeleton() {
  return (
    <div className="mt-6 rounded-panel border border-line bg-surface p-6 sm:p-8" role="status" aria-label="Loading hackathon details">
      <Skeleton className="h-5 w-28" />
      <Skeleton className="mt-4 h-9 w-2/3" />
      <Skeleton className="mt-3 h-4 w-1/2" />
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}

export default function HackathonDetailPage() {
  const { hackathonId } = useParams();
  const { isAuthenticated } = useAuth();
  usePageTitle('Hackathon details');

  const hackathon = useQuery({
    queryKey: queryKeys.hackathons.detail(hackathonId),
    queryFn: () => getHackathon(hackathonId),
    enabled: Boolean(hackathonId),
  });

  const backLink = (
    <Link
      to={paths.hackathons}
      className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-lime"
    >
      <ArrowLeft size={15} aria-hidden="true" />
      All hackathons
    </Link>
  );

  if (hackathon.isPending) {
    return (
      <div>
        {backLink}
        <DetailSkeleton />
      </div>
    );
  }

  if (hackathon.isError) {
    if (hackathon.error?.status === 404) {
      return (
        <div>
          {backLink}
          <EmptyState
            className="mt-6"
            icon={CalendarDays}
            title="Hackathon not found"
            description="This event does not exist or has been removed."
            action={<ButtonLink to={paths.hackathons}>Back to hackathons</ButtonLink>}
          />
        </div>
      );
    }
    return (
      <div>
        {backLink}
        <ErrorState
          className="mt-6"
          title="Hackathon details could not be loaded"
          message={hackathon.error?.message}
          onRetry={() => hackathon.refetch()}
          retryLabel="Reload hackathon"
        />
      </div>
    );
  }

  const item = hackathon.data;
  const status = hackathonStatus(item);
  const registrationUrl = safeHttpUrl(item.registrationUrl);
  const registrationOpen = status.registration !== 'closed';
  const location = item.mode === 'ONLINE' ? 'Online' : item.location || 'Location not listed';
  const teamSize =
    item.minTeamSize || item.maxTeamSize
      ? `${item.minTeamSize || '?'}–${item.maxTeamSize || '?'} members`
      : 'Not listed';
  const teamNext = `${paths.teams}?hackathonId=${item.id}`;

  return (
    <div>
      {backLink}

      <article className="mt-4 overflow-hidden rounded-panel border border-line bg-surface">
        <div className="border-b border-line p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="neutral">{item.domain || 'General'}</Badge>
            <Badge variant="outline">{modeLabel(item.mode)}</Badge>
            <Badge variant={eventTone(status.event)}>{status.eventLabel}</Badge>
            <Badge variant={registrationTone(status.registration)} dot>
              {status.registrationLabel}
            </Badge>
          </div>

          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{item.name}</h1>
              <p className="mt-2 text-sm text-silver">
                {item.organizer || 'Organizer not listed'}
                <span className="mx-2 text-line">·</span>
                {item.mode === 'ONLINE' ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Globe2 size={14} aria-hidden="true" /> Online
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={14} aria-hidden="true" />
                    {location}
                  </span>
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {registrationOpen && registrationUrl ? (
                <a
                  href={registrationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClasses({ variant: 'primary' })}
                >
                  Register on organizer site
                  <ArrowUpRight size={16} aria-hidden="true" />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              ) : status.registration === 'closed' ? (
                <span className="inline-flex h-11 items-center rounded-xl border border-line px-4 text-sm text-muted">
                  Registration closed
                </span>
              ) : (
                <span className="text-xs text-muted">Registration link not provided.</span>
              )}

              {isAuthenticated ? (
                <ButtonLink to={teamNext} variant="outline" icon={Users}>
                  Create a team
                </ButtonLink>
              ) : (
                <ButtonLink
                  to={`${paths.login}?next=${encodeURIComponent(paths.hackathon(item.id))}`}
                  variant="outline"
                  icon={Lock}
                >
                  Log in to create a team
                </ButtonLink>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.55fr_1fr]">
          <div className="space-y-8">
            <section>
              <h2 className="text-lg font-semibold tracking-tight">About this hackathon</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-silver">
                {item.description || 'The organizer has not provided a description.'}
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold tracking-tight">Eligibility</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-silver">
                {item.eligibility || 'The organizer has not listed eligibility requirements.'}
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold tracking-tight">Registration</h2>
              {item.registrationDeadline ? (
                <p className="mt-2 text-sm text-silver">
                  Registration closes on{' '}
                  <strong className="text-ink">{formatDate(item.registrationDeadline)}</strong>.
                </p>
              ) : (
                <p className="mt-2 text-sm text-silver">
                  The organizer has not listed a registration deadline.
                </p>
              )}

              {status.registration === 'closed' ? (
                <p className="mt-2 text-sm text-muted">
                  This deadline has passed according to your device date. Check the organizer page
                  for any extension.
                </p>
              ) : null}
              {status.registration === 'today' ? (
                <p className="mt-2 text-sm text-amber-300">
                  The registration deadline is today. Confirm the exact time on the organizer page.
                </p>
              ) : null}

              {registrationUrl ? (
                <p className="mt-3">
                  <a
                    href={registrationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-lime hover:underline"
                  >
                    Open the registration page
                    <ArrowUpRight size={14} aria-hidden="true" />
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </p>
              ) : (
                <p className="mt-3 text-sm text-muted">No registration URL was provided.</p>
              )}

              <p className="mt-4 flex items-start gap-2 rounded-xl border border-line bg-background/50 p-3 text-xs text-muted">
                <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                Dates are calendar dates from the organizer; FusionV compares them with your
                device’s local date. Deadlines may use the organizer’s timezone.
              </p>
            </section>
          </div>

          <aside>
            <h2 className="text-lg font-semibold tracking-tight">Key details</h2>
            <dl className="mt-3 divide-y divide-line rounded-panel border border-line">
              {[
                { icon: CalendarDays, label: 'Dates', value: formatDateRange(item.startDate, item.endDate) || 'Not listed' },
                {
                  icon: Clock,
                  label: 'Registration deadline',
                  value: item.registrationDeadline ? formatDate(item.registrationDeadline) : 'Not listed',
                },
                { icon: Globe2, label: 'Mode', value: modeLabel(item.mode) },
                { icon: MapPin, label: 'Location', value: location },
                { icon: Users, label: 'Team size', value: teamSize },
              ].map((row) => {
                const Icon = row.icon;
                return (
                  <div key={row.label} className="flex items-start gap-3 px-4 py-3">
                    <Icon size={15} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
                    <div className="min-w-0">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                        {row.label}
                      </dt>
                      <dd className="mt-0.5 break-words text-sm text-silver">{row.value}</dd>
                    </div>
                  </div>
                );
              })}
              <div className="px-4 py-3">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                  Domain
                </dt>
                <dd className="mt-0.5 text-sm text-silver">{item.domain || 'Not listed'}</dd>
              </div>
            </dl>

            {isAuthenticated ? (
              <Link
                to={`${paths.teams}?hackathonId=${item.id}`}
                className="mt-4 inline-flex items-center gap-1.5 text-sm text-lime hover:underline"
              >
                <Users size={15} aria-hidden="true" />
                Teams linked to this hackathon
              </Link>
            ) : null}
          </aside>
        </div>
      </article>
    </div>
  );
}
