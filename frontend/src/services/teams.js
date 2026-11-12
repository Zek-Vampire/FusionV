import { apiClient } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';

/**
 * The backend expects repeated `skill` parameters and omits empty filters.
 * URLSearchParams keeps that contract instead of Axios' `skill[]=` default.
 */
function buildTeamParams(params = {}) {
  const search = new URLSearchParams();
  const set = (key, value) => {
    if (value === '' || value === null || value === undefined || value === false) return;
    search.set(key, String(value));
  };
  set('q', params.q);
  (params.skill || []).filter(Boolean).forEach((skill) => search.append('skill', skill));
  set('hackathonId', params.hackathonId);
  set('minSize', params.minSize);
  set('maxSize', params.maxSize);
  if (params.openOnly) search.set('openOnly', 'true');
  if (params.mine) search.set('mine', 'true');
  set('sort', params.sort);
  return search;
}

/** GET /teams — protected by the backend. */
export function listTeams(params = {}) {
  return apiClient.get(endpoints.teams.list, { params: buildTeamParams(params) });
}

/** Backwards-compatible alias used by the global search page. */
export function searchTeams(params = {}) {
  return listTeams(params);
}

/** GET /teams/{id} */
export function getTeam(id) {
  return apiClient.get(endpoints.teams.byId(id));
}

/** POST /teams */
export function createTeam(team) {
  return apiClient.post(endpoints.teams.create, team);
}

/** PUT /teams/{id} — leader only. */
export function updateTeam(id, team) {
  return apiClient.put(endpoints.teams.byId(id), team);
}

/** DELETE /teams/{id} — leader or admin. */
export function deleteTeam(id) {
  return apiClient.delete(endpoints.teams.byId(id));
}

/** POST /teams/{id}/join-requests */
export function requestToJoin(id) {
  return apiClient.post(`${endpoints.teams.byId(id)}/join-requests`);
}

/** DELETE /teams/{id}/join-requests/me */
export function cancelJoinRequest(id) {
  return apiClient.delete(`${endpoints.teams.byId(id)}/join-requests/me`);
}

/** GET /teams/{id}/join-requests — leader only. */
export function listJoinRequests(id) {
  return apiClient.get(endpoints.teams.joinRequests(id));
}

/** POST /teams/join-requests/{requestId}/accept|reject */
export function decideJoinRequest(requestId, accept) {
  const path = accept ? endpoints.teams.acceptRequest(requestId) : endpoints.teams.rejectRequest(requestId);
  return apiClient.post(path);
}

/** POST /teams/{id}/invitations */
export function inviteToTeam(id, email) {
  return apiClient.post(endpoints.teams.invitations(id), { email });
}

/** GET /invitations */
export function listMyInvitations() {
  return apiClient.get(endpoints.teams.myInvitations);
}

/** POST /invitations/{id}/accept|decline */
export function respondToInvitation(id, accept) {
  const path = accept
    ? endpoints.teams.acceptInvitation(id)
    : endpoints.teams.declineInvitation(id);
  return apiClient.post(path);
}

/** DELETE /teams/{id}/members/me */
export function leaveTeam(id) {
  return apiClient.delete(endpoints.teams.leave(id));
}
