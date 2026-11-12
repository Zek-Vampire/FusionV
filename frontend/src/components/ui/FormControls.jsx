import { useId, useState } from 'react';
import { Check, ChevronDown, Eye, EyeOff, Search, X } from 'lucide-react';
import { cn } from '@/lib/cn';

const CONTROL =
  'w-full rounded-xl border border-line bg-background/60 px-3.5 text-sm text-ink placeholder:text-muted/70 transition-colors focus:border-lime/60 focus:outline-none focus:ring-2 focus:ring-lime/20 disabled:cursor-not-allowed disabled:opacity-60';

function Message({ id, error, hint }) {
  if (!error && !hint) return null;
  return (
    <p id={id} role={error ? 'alert' : undefined} className={cn('text-xs', error ? 'text-red-300' : 'text-muted')}>
      {error || hint}
    </p>
  );
}

export function Input({ id, label, hint, error, className, containerClassName, ...props }) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const messageId = error || hint ? `${inputId}-message` : undefined;

  return (
    <div className={cn('space-y-1.5', containerClassName)}>
      {label ? (
        <label htmlFor={inputId} className="block text-xs font-medium uppercase tracking-[0.14em] text-muted">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={messageId}
        className={cn(
          CONTROL,
          'h-11',
          error && 'border-red-400/60 focus:border-red-400 focus:ring-red-400/20',
          className,
        )}
        {...props}
      />
      <Message id={messageId} error={error} hint={hint} />
    </div>
  );
}

export function PasswordInput({
  id,
  label,
  hint,
  error,
  className,
  containerClassName,
  autoComplete = 'current-password',
  ...props
}) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const messageId = error || hint ? `${inputId}-message` : undefined;
  const [visible, setVisible] = useState(false);

  return (
    <div className={cn('space-y-1.5', containerClassName)}>
      {label ? (
        <label htmlFor={inputId} className="block text-xs font-medium uppercase tracking-[0.14em] text-muted">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <input
          id={inputId}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={messageId}
          className={cn(
            CONTROL,
            'h-11 pr-11',
            error && 'border-red-400/60 focus:border-red-400 focus:ring-red-400/20',
            className,
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition-colors hover:bg-elevated hover:text-ink"
        >
          {visible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
        </button>
      </div>
      <Message id={messageId} error={error} hint={hint} />
    </div>
  );
}

export function Textarea({ id, label, hint, error, className, containerClassName, rows = 4, ...props }) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const messageId = error || hint ? `${inputId}-message` : undefined;

  return (
    <div className={cn('space-y-1.5', containerClassName)}>
      {label ? (
        <label htmlFor={inputId} className="block text-xs font-medium uppercase tracking-[0.14em] text-muted">
          {label}
        </label>
      ) : null}
      <textarea
        id={inputId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={messageId}
        className={cn(
          CONTROL,
          'py-2.5 leading-relaxed',
          error && 'border-red-400/60 focus:border-red-400 focus:ring-red-400/20',
          className,
        )}
        {...props}
      />
      <Message id={messageId} error={error} hint={hint} />
    </div>
  );
}

export function Select({ id, label, hint, error, className, containerClassName, children, ...props }) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const messageId = error || hint ? `${inputId}-message` : undefined;

  return (
    <div className={cn('space-y-1.5', containerClassName)}>
      {label ? (
        <label htmlFor={inputId} className="block text-xs font-medium uppercase tracking-[0.14em] text-muted">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <select
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={messageId}
          className={cn(CONTROL, 'h-11 appearance-none pr-10', className)}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
        />
      </div>
      <Message id={messageId} error={error} hint={hint} />
    </div>
  );
}

export function Checkbox({ id, label, description, className, ...props }) {
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <label htmlFor={inputId} className={cn('group flex cursor-pointer items-start gap-3', className)}>
      <span className="relative mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center">
        <input id={inputId} type="checkbox" className="peer sr-only" {...props} />
        <span className="flex h-5 w-5 items-center justify-center rounded-md border border-line bg-background/60 transition-colors peer-checked:border-lime peer-checked:bg-lime peer-focus-visible:ring-2 peer-focus-visible:ring-lime/40 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100">
          <Check size={13} strokeWidth={3} aria-hidden="true" className="text-background transition-opacity" />
        </span>
      </span>
      <span className="min-w-0">
        <span className="block text-sm text-ink">{label}</span>
        {description ? <span className="mt-0.5 block text-xs text-muted">{description}</span> : null}
      </span>
    </label>
  );
}

export function Switch({ id, checked = false, onChange, label, description, disabled = false, className }) {
  const autoId = useId();
  const switchId = id ?? autoId;
  const descriptionId = description ? `${switchId}-description` : undefined;

  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <label htmlFor={switchId} className="block text-sm text-ink">
          {label}
        </label>
        {description ? (
          <p id={descriptionId} className="mt-0.5 text-xs text-muted">
            {description}
          </p>
        ) : null}
      </div>
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        aria-describedby={descriptionId}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={cn(
          'relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime disabled:opacity-50',
          checked ? 'border-lime/60 bg-lime/25' : 'border-line bg-elevated',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'inline-block h-4 w-4 rounded-full transition-transform duration-200',
            checked ? 'translate-x-6 bg-lime' : 'translate-x-1 bg-muted',
          )}
        />
      </button>
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search…',
  label = 'Search',
  className,
  inputClassName,
  autoFocus = false,
}) {
  return (
    <form
      role="search"
      className={cn('relative', className)}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.(value);
      }}
    >
      <Search
        size={16}
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
      />
      <input
        type="search"
        value={value}
        autoFocus={autoFocus}
        aria-label={label}
        placeholder={placeholder}
        onChange={(event) => onChange?.(event.target.value)}
        className={cn(CONTROL, 'h-10 pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden', inputClassName)}
      />
      {value ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            onChange?.('');
            onSubmit?.('');
          }}
          className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted transition-colors hover:bg-elevated hover:text-ink"
        >
          <X size={14} aria-hidden="true" />
        </button>
      ) : null}
    </form>
  );
}
