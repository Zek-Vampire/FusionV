import { apiClient } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';

/** GET /skills — public list of skill names. */
export function listSkills() {
  return apiClient.get(endpoints.skills);
}
