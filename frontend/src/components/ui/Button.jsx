import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-[transform,background-color,border-color,color,box-shadow] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime disabled:pointer-events-none disabled:opacity-50 active:translate-y-px';

export const BUTTON_VARIANTS = {
  primary:
    'bg-lime text-background shadow-[0_10px_40px_-12px_rgba(117,255,67,0.75)] hover:bg-lime-dark hover:shadow-[0_14px_50px_-12px_rgba(117,255,67,0.9)]',
  secondary: 'border border-line bg-elevated text-ink hover:border-lime/50 hover:bg-surface',
  outline: 'border border-line bg-transparent text-silver hover:border-lime hover:text-lime',
  ghost: 'bg-transparent text-silver hover:bg-elevated hover:text-ink',
  subtle: 'bg-lime/10 text-lime hover:bg-lime/15',
  danger: 'bg-red-500 text-white hover:bg-red-400',
};

export const BUTTON_SIZES = {
  sm: 'h-9 px-3 text-xs',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
  icon: 'h-10 w-10',
};

export function buttonClasses({ variant = 'primary', size = 'md', className } = {}) {
  return cn(BASE, BUTTON_VARIANTS[variant] ?? BUTTON_VARIANTS.primary, BUTTON_SIZES[size] ?? BUTTON_SIZES.md, className);
}

const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    className,
    loading = false,
    icon: Icon,
    iconRight: IconRight,
    children,
    disabled,
    type = 'button',
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClasses({ variant, size, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : null}
      {!loading && Icon ? <Icon size={16} aria-hidden="true" /> : null}
      {children}
      {!loading && IconRight ? <IconRight size={16} aria-hidden="true" /> : null}
    </button>
  );
});

export default Button;

export function ButtonLink({
  to,
  variant = 'primary',
  size = 'md',
  className,
  icon: Icon,
  iconRight: IconRight,
  children,
  ...props
}) {
  return (
    <Link to={to} className={buttonClasses({ variant, size, className })} {...props}>
      {Icon ? <Icon size={16} aria-hidden="true" /> : null}
      {children}
      {IconRight ? <IconRight size={16} aria-hidden="true" /> : null}
    </Link>
  );
}
