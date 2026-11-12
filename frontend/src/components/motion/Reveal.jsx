import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

/**
 * Scroll reveals use IntersectionObserver and CSS transitions. Keeping these
 * primitives free of Motion means the public landing page does not download an
 * animation runtime before it can render.
 */
function useInView({ once = true, margin = '-72px' } = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    if (typeof IntersectionObserver !== 'function') {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        if (once) observer.disconnect();
      },
      { rootMargin: margin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [once, margin]);

  return [ref, visible];
}

export function Reveal({ children, className, delay = 0, y = 18, once = true }) {
  const [ref, visible] = useInView({ once });

  return (
    <div
      ref={ref}
      className={cn('reveal', visible && 'is-visible', className)}
      style={{ '--reveal-delay': `${delay}s`, '--reveal-y': `${y}px` }}
    >
      {children}
    </div>
  );
}

export function Stagger({ children, className, stagger = 0.06 }) {
  const [ref, visible] = useInView({ once: true, margin: '-60px' });

  return (
    <div
      ref={ref}
      className={cn('reveal-stagger', visible && 'is-visible', className)}
      style={{ '--reveal-stagger': `${stagger}s` }}
    >
      {children}
    </div>
  );
}

export function StaggerItem({ children, className }) {
  return <div className={cn('reveal-item', className)}>{children}</div>;
}
