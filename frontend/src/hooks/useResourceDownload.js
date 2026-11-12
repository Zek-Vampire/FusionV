import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { downloadResource } from '@/services/resources';
import { useToast } from '@/context/ToastContext';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Downloads a resource as a blob, preserving the Content-Disposition filename,
 * and reports the real backend/network error when it fails.
 */
export function useResourceDownload(resource, { onComplete } = {}) {
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  async function download() {
    if (!resource || downloading) return;
    setDownloading(true);
    try {
      await downloadResource(resource);
      toast({
        title: 'Download started',
        description: resource.originalFileName || resource.title,
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.resources.all });
      onComplete?.();
    } catch (error) {
      toast({
        title: 'Download failed',
        description: error?.message || 'The file could not be downloaded.',
        variant: 'error',
        duration: 7000,
      });
    } finally {
      setDownloading(false);
    }
  }

  return { downloading, download };
}
