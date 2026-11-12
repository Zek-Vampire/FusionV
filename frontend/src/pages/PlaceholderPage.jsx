import { ArrowLeft, Construction } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { paths } from '@/routes/paths';

/**
 * Explicit route skeleton. It never renders sample data or a disabled mock UI:
 * it states what the route is, which phase implements it and which endpoints it will use.
 */
export default function PlaceholderPage({ title, phase, description, plannedEndpoints = [] }) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="lime" dot>
          Route skeleton
        </Badge>
        <Badge variant="neutral">{phase}</Badge>
      </div>

      <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-3 text-silver">{description}</p>

      <Card interactive className="mt-8">
        <div className="p-6 sm:p-7">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-lime/25 bg-lime/10 text-lime">
              <Construction size={18} aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">Planned in {phase}</p>
              <p className="mt-1 text-sm text-muted">
                This page is intentionally empty. No data is displayed because the page has not
                been implemented yet.
              </p>
            </div>
          </div>

          {plannedEndpoints.length > 0 ? (
            <div className="mt-6">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                Planned endpoints
              </h2>
              <ul className="mt-2 flex flex-wrap gap-2">
                {plannedEndpoints.map((endpoint) => (
                  <li
                    key={endpoint}
                    className="rounded-md border border-line bg-elevated px-2 py-1 font-mono text-xs text-silver"
                  >
                    {endpoint}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <ButtonLink
            to={paths.home}
            variant="outline"
            size="sm"
            icon={ArrowLeft}
            className="mt-6"
          >
            Back to the foundation overview
          </ButtonLink>
        </div>
      </Card>
    </div>
  );
}
