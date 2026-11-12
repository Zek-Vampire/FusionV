import { Link } from 'react-router-dom';
import { CalendarDays, Download, FileText, HardDrive, User } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useResourceDownload } from '@/hooks/useResourceDownload';
import {
  categoryLabel,
  fileExtension,
  fileSize,
  formatDate,
  formatNumber,
  truncate,
} from '@/lib/format';
import { paths } from '@/routes/paths';

export function ResourceDownloadButton({
  resource,
  variant = 'secondary',
  size = 'sm',
  label = 'Download',
  onComplete,
}) {
  const { downloading, download } = useResourceDownload(resource, { onComplete });

  return (
    <Button
      variant={variant}
      size={size}
      icon={Download}
      loading={downloading}
      onClick={download}
      aria-label={`Download ${resource.title}`}
    >
      {downloading ? 'Downloading…' : label}
    </Button>
  );
}

export default function ResourceCard({ resource, canSeeUploader = false }) {
  const extension = (fileExtension(resource.originalFileName) || 'FILE').toUpperCase();

  return (
    <article className="flex h-full flex-col gap-4 rounded-panel border border-line bg-surface p-5 transition-colors duration-200 hover:border-lime/40 sm:flex-row">
      <div
        aria-hidden="true"
        className="flex h-16 w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-lime/25 bg-lime/[0.07] text-lime"
      >
        <FileText size={20} />
        <span className="text-[10px] font-bold tracking-wider">{extension}</span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="lime">{categoryLabel(resource.category)}</Badge>
          {resource.subject ? <Badge variant="neutral">{resource.subject}</Badge> : null}
        </div>

        <h2 className="mt-2 text-base font-semibold leading-snug tracking-tight">
          <Link
            to={paths.resource(resource.id)}
            className="transition-colors hover:text-lime focus-visible:text-lime"
          >
            {resource.title}
          </Link>
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-silver">
          {truncate(resource.description || 'No description provided.', 150)}
        </p>

        {resource.tags ? (
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Tags">
            {String(resource.tags)
              .split(',')
              .filter(Boolean)
              .map((tag) => (
                <li
                  key={tag}
                  className="rounded-md border border-line bg-elevated px-2 py-0.5 text-[11px] text-muted"
                >
                  {tag}
                </li>
              ))}
          </ul>
        ) : null}

        <ul className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted">
          <li className="inline-flex items-center gap-1.5">
            <User size={13} aria-hidden="true" />
            {canSeeUploader ? (
              <Link to={paths.student(resource.uploaderId)} className="text-silver hover:text-lime">
                {resource.uploaderName}
              </Link>
            ) : (
              <span>{resource.uploaderName}</span>
            )}
          </li>
          <li className="inline-flex items-center gap-1.5">
            <CalendarDays size={13} aria-hidden="true" />
            {formatDate(resource.createdAt)}
          </li>
          <li className="inline-flex items-center gap-1.5">
            <HardDrive size={13} aria-hidden="true" />
            {fileSize(resource.sizeBytes)}
          </li>
          <li className="inline-flex items-center gap-1.5">
            <Download size={13} aria-hidden="true" />
            {formatNumber(resource.downloadCount)} downloads
          </li>
        </ul>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <Link
            to={paths.resource(resource.id)}
            className="inline-flex h-9 items-center justify-center rounded-xl border border-line bg-transparent px-3 text-xs font-semibold text-silver transition-colors hover:border-lime hover:text-lime"
          >
            Details
          </Link>
          <ResourceDownloadButton resource={resource} />
        </div>
      </div>
    </article>
  );
}
