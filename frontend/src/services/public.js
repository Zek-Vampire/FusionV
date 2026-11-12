import { apiClient } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';

/** GET /public/stats — aggregate counts only, no personal data. */
export function getPublicStats() {
  return apiClient.get(endpoints.public.stats);
}
