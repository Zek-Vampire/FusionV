import { Link } from 'react-router-dom';
import { ArrowUpRight, CalendarDays, Clock, Globe2, MapPin, Users } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { buttonClasses } from '@/components/ui/Button';
import {
  eventTone,
  hackathonStatus,
  registrationTone,
} from '@/lib/hackathonStatus';
import { formatDate, formatDateRange, modeLabel, truncate } from '@/lib/format';
import { safeHttpUrl } from '@/lib/validation';
import { paths } from '@/routes/paths';

function teamSizeLabel(hackathon) {
  if (!hackathon.minTeamSize && !hackathon.maxTeamSize) return 'Not listed';
  return `${hackathon.minTeamSize || '?'}–${hackathon.maxTeamSize || '?'} members`;
}

export default function HackathonCard({ hackathon }) {
  const status = hackathonStatus(hackathon);
  const registrationUrl = safeHttpUrl(hackathon.registrationUrl);
  const registrationOpen = status.registration !== 'closed';
  const location =
    hackathon.mode === 'ONLINE' ? 'Online' : hackathon.location || 'Location not listed';

  return (
    <article className="group flex h-full flex-col rounded-panel border border-line bg-surface p-5 transition-colors duration-200 hover:border-lime/40">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="neutral">{hackathon.domain || 'General'}</Badge>
        <Badge variant="outline">{modeLabel(hackathon.mode)}</Badge>
        <Badge variant={eventTone(status.event)}>{status.eventLabel}</Badge>
      </div>

      <div className="mt-3 flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold leading-snug tracking-tight">
          <Link
            to={paths.hackathon(hackathon.id)}
            className="transition-colors hover:text-lime focus-visible:text-lime"
          >
            {hackathon.name}
          </Link>
        </h2>
        <Badge variant={registrationTone(status.registration)} dot className="shrink-0">
          {status.registrationLabel}
        </Badge>
      </div>

      <p className="mt-1 text-sm text-muted">
        {hackathon.organizer || 'Organizer not listed'}
      </p>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-silver">
        {truncate(
          hackathon.description || 'No description has been provided for this event.',
          170,
        )}
      </p>

      <dl className="mt-4 grid gap-2 text-xs text-silver">
        <div className="flex items-start gap-2">
          <CalendarDays size={14} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
          <div>
            <dt className="inline font-medium text-muted">Dates: </dt>
            <dd className="inline">{formatDateRange(hackathon.startDate, hackathon.endDate) || 'Not listed'}</dd>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Clock size={14} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
          <div>
            <dt className="inline font-medium text-muted">Registration deadline: </dt>
            <dd className="inline">
              {hackathon.registrationDeadline
                ? formatDate(hackathon.registrationDeadline)
                : 'Not listed'}
            </dd>
          </div>
        </div>
        <div className="flex items-start gap-2">
          {hackathon.mode === 'ONLINE' ? (
            <Globe2 size={14} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
          ) : (
            <MapPin size={14} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
          )}
          <div>
            <dt className="inline font-medium text-muted">Location: </dt>
            <dd className="inline">{location}</dd>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Users size={14} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
          <div>
            <dt className="inline font-medium text-muted">Team size: </dt>
            <dd className="inline">{teamSizeLabel(hackathon)}</dd>
          </div>
        </div>
      </dl>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
        <Link to={paths.hackathon(hackathon.id)} className={buttonClasses({ variant: 'outline', size: 'sm' })}>
          View details
        </Link>
        {registrationOpen && registrationUrl ? (
          <a
            href={registrationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses({ variant: 'subtle', size: 'sm' })}
          >
            Registration page
            <ArrowUpRight size={14} aria-hidden="true" />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        ) : null}
      </div>
    </article>
  );
}
