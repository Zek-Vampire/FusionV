import SpotlightCard from '@/components/reactbits/SpotlightCard';
import { cn } from '@/lib/cn';

/**
 * FusionV overrides for the vendored SpotlightCard palette, so the effect uses
 * the design tokens instead of the component's default near-black surface.
 */
const SPOTLIGHT_SURFACE = {
  '--spotlight-card-surface': '#0d120f',
  '--spotlight-card-border': 'rgba(117, 255, 67, 0.16)',
  '--spotlight-card-shadow': '0 32px 80px -48px rgba(0, 0, 0, 0.95)',
};

export function Card({ interactive = false, className, children, ...props }) {
  if (interactive) {
    return (
      <SpotlightCard
        className={cn('border border-line/60', className)}
        style={{ padding: 0, borderRadius: 'var(--radius-panel)', ...SPOTLIGHT_SURFACE }}
        spotlightColor="rgba(117, 255, 67, 0.8)"
        intensity={0.12}
        spotlightSize={320}
        softness={0.78}
        borderGlow={0.55}
        {...props}
      >
        {children}
      </SpotlightCard>
    );
  }

  return (
    <div className={cn('rounded-panel border border-line bg-surface', className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div className={cn('flex items-start justify-between gap-4 px-5 pt-5', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h3 className={cn('text-base font-semibold tracking-tight text-ink', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }) {
  return (
    <p className={cn('mt-1 text-sm text-muted', className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }) {
  return (
    <div className={cn('px-5 py-5', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }) {
  return (
    <div
      className={cn('flex flex-wrap items-center gap-2 border-t border-line px-5 py-3', className)}
      {...props}
    >
      {children}
    </div>
  );
}
