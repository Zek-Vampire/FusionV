import { apiClient } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';

function cleanParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined),
  );
}

/** GET /hackathons — the backend supports only the documented query parameters. */
export function listHackathons(params = {}) {
  return apiClient.get(endpoints.hackathons.list, { params: cleanParams(params) });
}

/** GET /hackathons/{id} */
export function getHackathon(id) {
  return apiClient.get(endpoints.hackathons.byId(id));
}
