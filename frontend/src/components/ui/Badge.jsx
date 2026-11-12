import { cn } from '@/lib/cn';

const VARIANTS = {
  lime: 'border-lime/30 bg-lime/10 text-lime',
  solid: 'border-transparent bg-lime text-background',
  neutral: 'border-line bg-elevated text-silver',
  outline: 'border-line bg-transparent text-muted',
  success: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  warning: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  danger: 'border-red-400/30 bg-red-400/10 text-red-300',
};

const DOTS = {
  lime: 'bg-lime',
  solid: 'bg-background',
  neutral: 'bg-silver',
  outline: 'bg-muted',
  success: 'bg-emerald-300',
  warning: 'bg-amber-300',
  danger: 'bg-red-300',
};

export default function Badge({ variant = 'neutral', dot = false, className, children, ...props }) {
  const key = VARIANTS[variant] ? variant : 'neutral';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide whitespace-nowrap',
        VARIANTS[key],
        className,
      )}
      {...props}
    >
      {dot ? <span aria-hidden="true" className={cn('h-1.5 w-1.5 rounded-full', DOTS[key])} /> : null}
      {children}
    </span>
  );
}
