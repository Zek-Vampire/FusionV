import { AlertTriangle, Inbox } from 'lucide-react';
import { cn } from '@/lib/cn';
import Button from './Button';

export function Spinner({ size = 18, label, className }) {
  return (
    <span
      role={label ? 'status' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn('inline-block animate-spin rounded-full border-2 border-line border-t-lime', className)}
      style={{ width: size, height: size }}
    />
  );
}

export function Skeleton({ className }) {
  return <span aria-hidden="true" className={cn('skeleton block rounded-lg', className)} />;
}

export function LoadingState({ label = 'Loading…', rows = 3, className }) {
  return (
    <div
      role="status"
      className={cn('rounded-panel border border-line bg-surface p-6', className)}
    >
      <div className="flex items-center gap-3">
        <Spinner />
        <p className="text-sm text-muted">{label}</p>
      </div>
      <div className="mt-5 space-y-2.5">
        {Array.from({ length: rows }, (_, index) => (
          <Skeleton key={index} className={index === rows - 1 ? 'h-3 w-2/3' : 'h-3 w-full'} />
        ))}
      </div>
    </div>
  );
}

export function EmptyState({
  icon: Icon = Inbox,
  title = 'Nothing here yet',
  description,
  action,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-panel border border-dashed border-line bg-surface/60 px-6 py-12 text-center',
        className,
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-lime/25 bg-lime/10 text-lime">
        <Icon size={22} aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      {description ? <p className="mt-1 max-w-sm text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try again',
  className,
}) {
  return (
    <div
      role="alert"
      className={cn(
        'rounded-panel border border-red-400/25 bg-red-400/[0.06] p-6 text-center sm:text-left',
        className,
      )}
    >
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-red-400/30 bg-red-400/10 text-red-300">
          <AlertTriangle size={18} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-semibold">{title}</h3>
          {message ? <p className="mt-1 text-sm text-muted">{message}</p> : null}
          {onRetry ? (
            <Button variant="outline" size="sm" onClick={onRetry} className="mt-4">
              {retryLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
