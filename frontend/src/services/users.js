import { apiClient, downloadAndSave, uploadFile } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';

/** GET /users/search — protected by the backend, capped at 50 results. */
export function searchStudents({ q = '', skill = '' } = {}) {
  return apiClient.get(endpoints.users.search, { params: { q, skill } });
}

/** GET /users/{id} — authenticated public-safe profile (no email or resume). */
export function getStudent(id) {
  return apiClient.get(endpoints.users.byId(id));
}

/** GET /users/me */
export function getMyProfile() {
  return apiClient.get(endpoints.users.me);
}

/** PUT /users/me — sends the complete supported field set. */
export function updateMyProfile(profile) {
  return apiClient.put(endpoints.users.me, profile);
}

/** PUT /users/me/skills — replaces the entire list. */
export function replaceSkills(values) {
  return apiClient.put(endpoints.users.skills, { values });
}

/** PUT /users/me/interests — replaces the entire list. */
export function replaceInterests(values) {
  return apiClient.put(endpoints.users.interests, { values });
}

/** GET /users/me/stats */
export function getMyStats() {
  return apiClient.get(endpoints.users.stats);
}

/** POST /users/me/password */
export function changePassword({ currentPassword, newPassword }) {
  return apiClient.post(endpoints.users.password, { currentPassword, newPassword });
}

/** GET /users/me/export — plain text, no Content-Disposition filename. */
export function downloadProfileExport() {
  return downloadAndSave(endpoints.users.export, 'fusionv-profile.txt');
}

/** POST /users/me/resume — multipart field "file". */
export function uploadResume(file, { onProgress } = {}) {
  const formData = new FormData();
  formData.append('file', file);
  return uploadFile(endpoints.users.resume, formData, { onProgress });
}

/** GET /users/me/resume */
export function downloadResume(filename = 'fusionv-resume') {
  return downloadAndSave(endpoints.users.resume, filename || 'fusionv-resume');
}
