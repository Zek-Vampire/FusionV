import { cn } from '@/lib/cn';

/** Shared page heading for the public application pages. */
export default function PageHeader({ eyebrow, title, description, actions, className, children }) {
  return (
    <div className={cn('border-b border-line pb-7', className)}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-lime">{eyebrow}</p>
          ) : null}
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          {description ? <p className="mt-2 max-w-2xl text-sm text-silver sm:text-base">{description}</p> : null}
          {children}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
