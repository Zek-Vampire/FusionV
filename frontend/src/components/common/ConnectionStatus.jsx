import { useQuery } from '@tanstack/react-query';
import { Activity } from 'lucide-react';
import { apiClient } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import Badge from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { ErrorState, LoadingState } from '@/components/ui/States';

const STAT_LABELS = [
  ['students', 'Students'],
  ['teams', 'Teams'],
  ['hackathons', 'Hackathons'],
  ['resources', 'Resources'],
  ['posts', 'Posts'],
];

/**
 * Foundation check: one real, public, read-only call (GET /public/stats).
 * It verifies the API client, the Vite proxy and TanStack Query together.
 * When the Spring Boot API is stopped the card says so instead of showing anything simulated.
 */
export default function ConnectionStatus() {
  const query = useQuery({
    queryKey: ['public', 'stats'],
    queryFn: () => apiClient.get(endpoints.public.stats),
    retry: false,
  });

  if (query.isPending) {
    return <LoadingState className="mt-8" label="Checking the API connection…" rows={1} />;
  }

  if (query.isError) {
    return (
      <div className="mt-8">
        <ErrorState
          title="Backend not reachable right now"
          message={`This card calls GET /api/v1/public/stats. Start the Spring Boot API on port 8080 (or set VITE_PROXY_TARGET) and retry. ${query.error?.message ?? ''}`.trim()}
          onRetry={() => query.refetch()}
          retryLabel={query.isFetching ? 'Retrying…' : 'Try again'}
        />
      </div>
    );
  }

  const stats = query.data || {};

  return (
    <Card className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-lime/25 bg-lime/10 text-lime">
            <Activity size={17} aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">API reachable</p>
            <p className="text-xs text-muted">
              Live totals from PostgreSQL via <code>GET /api/v1/public/stats</code>.
            </p>
          </div>
        </div>
        <Badge variant="success" dot>
          connected
        </Badge>
      </div>

      <dl className="grid grid-cols-2 gap-3 px-5 py-4 sm:grid-cols-5">
        {STAT_LABELS.map(([key, label]) => (
          <div key={key} className="rounded-lg border border-line bg-elevated px-3 py-2">
            <dt className="text-[11px] uppercase tracking-wide text-muted">{label}</dt>
            <dd className="mt-0.5 text-lg font-semibold text-ink">
              {Number.isFinite(Number(stats[key])) ? Number(stats[key]).toLocaleString() : '—'}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
