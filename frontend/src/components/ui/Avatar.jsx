import { useState } from 'react';
import { cn } from '@/lib/cn';

const SIZES = {
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
};

export function initials(name) {
  return String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export default function Avatar({ name = '', src, size = 'md', className }) {
  const [broken, setBroken] = useState(false);
  const label = name || 'FusionV member';

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-elevated font-semibold text-lime',
        SIZES[size] ?? SIZES.md,
        className,
      )}
    >
      {src && !broken ? (
        <img
          src={src}
          alt={label}
          className="h-full w-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        <>
          <span aria-hidden="true">{initials(name)}</span>
          <span className="sr-only">{label}</span>
        </>
      )}
    </span>
  );
}
