import { useEffect } from 'react';

/** Keeps the document title consistent with the legacy app's per-view titles. */
export function usePageTitle(title) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} — FusionV` : 'FusionV';
    return () => {
      document.title = previous;
    };
  }, [title]);
}
