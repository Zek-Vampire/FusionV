import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, FileText, FolderOpen, HardDrive, User } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { ResourceDownloadButton } from '@/components/cards/ResourceCard';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { useAuth } from '@/context/AuthContext';
import { usePageTitle } from '@/hooks/usePageTitle';
import {
  categoryLabel,
  fileExtension,
  fileSize,
  formatDate,
  formatNumber,
} from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import { getResource } from '@/services/resources';
import { paths } from '@/routes/paths';

export default function ResourceDetailPage() {
  const { resourceId } = useParams();
  const { isAuthenticated } = useAuth();
  usePageTitle('Resource details');

  const resource = useQuery({
    queryKey: queryKeys.resources.detail(resourceId),
    queryFn: () => getResource(resourceId),
    enabled: Boolean(resourceId),
  });

  const backLink = (
    <Link
      to={paths.resources}
      className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-lime"
    >
      <ArrowLeft size={15} aria-hidden="true" />
      Back to resources
    </Link>
  );

  if (resource.isPending) {
    return (
      <div>
        {backLink}
        <div className="mt-6 rounded-panel border border-line bg-surface p-6 sm:p-8" role="status" aria-label="Loading resource details">
          <div className="flex gap-4">
            <Skeleton className="h-16 w-16 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
          <Skeleton className="mt-8 h-24 w-full" />
        </div>
      </div>
    );
  }

  if (resource.isError) {
    if (resource.error?.status === 404) {
      return (
        <div>
          {backLink}
          <EmptyState
            className="mt-6"
            icon={FolderOpen}
            title="Resource not found"
            description="This resource does not exist, or it has been deleted by its uploader."
            action={<ButtonLink to={paths.resources}>Back to resources</ButtonLink>}
          />
        </div>
      );
    }
    return (
      <div>
        {backLink}
        <ErrorState
          className="mt-6"
          title="Resource details could not be loaded"
          message={resource.error?.message}
          onRetry={() => resource.refetch()}
          retryLabel="Reload resource"
        />
      </div>
    );
  }

  const item = resource.data;
  const extension = (fileExtension(item.originalFileName) || 'FILE').toUpperCase();
  const tags = String(item.tags || '')
    .split(',')
    .filter(Boolean);

  return (
    <div>
      {backLink}

      <article className="mt-4 overflow-hidden rounded-panel border border-line bg-surface">
        <div className="border-b border-line p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 gap-4">
              <div
                aria-hidden="true"
                className="flex h-16 w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-lime/25 bg-lime/[0.07] text-lime"
              >
                <FileText size={22} />
                <span className="text-[10px] font-bold tracking-wider">{extension}</span>
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="lime">{categoryLabel(item.category)}</Badge>
                  {item.subject ? <Badge variant="neutral">{item.subject}</Badge> : null}
                </div>
                <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{item.title}</h1>
                <p className="mt-2 text-sm text-silver">
                  Uploaded by{' '}
                  {isAuthenticated ? (
                    <Link to={paths.student(item.uploaderId)} className="text-lime hover:underline">
                      {item.uploaderName}
                    </Link>
                  ) : (
                    <span>{item.uploaderName}</span>
                  )}{' '}
                  on {formatDate(item.createdAt)}
                </p>
              </div>
            </div>

            <ResourceDownloadButton
              resource={item}
              variant="primary"
              size="lg"
              label="Download file"
            />
          </div>
        </div>

        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.55fr_1fr]">
          <div className="space-y-6">
            <section>
              <h2 className="text-lg font-semibold tracking-tight">Description</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-silver">
                {item.description || 'No description was provided.'}
              </p>
            </section>

            {tags.length > 0 ? (
              <section>
                <h2 className="text-lg font-semibold tracking-tight">Tags</h2>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-md border border-line bg-elevated px-2.5 py-1 text-xs text-silver"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <aside>
            <h2 className="text-lg font-semibold tracking-tight">File information</h2>
            <dl className="mt-3 divide-y divide-line rounded-panel border border-line">
              <div className="px-4 py-3">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                  File name
                </dt>
                <dd className="mt-0.5 break-all text-sm text-silver">
                  {item.originalFileName || 'Unknown'}
                </dd>
              </div>
              <div className="px-4 py-3">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                  Type
                </dt>
                <dd className="mt-0.5 text-sm text-silver">
                  {fileExtension(item.originalFileName).toUpperCase() || item.contentType || 'Not listed'}
                </dd>
              </div>
              <div className="flex items-start gap-2 px-4 py-3">
                <HardDrive size={15} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                    Size
                  </dt>
                  <dd className="mt-0.5 text-sm text-silver">{fileSize(item.sizeBytes)}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2 px-4 py-3">
                <User size={15} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                    Uploader
                  </dt>
                  <dd className="mt-0.5 text-sm text-silver">{item.uploaderName}</dd>
                </div>
              </div>
              <div className="px-4 py-3">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                  Downloads
                </dt>
                <dd className="mt-0.5 text-sm text-silver">{formatNumber(item.downloadCount)}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </article>
    </div>
  );
}
