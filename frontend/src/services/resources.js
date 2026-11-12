import { apiClient, downloadAndSave, uploadFile } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';

function cleanParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined),
  );
}

/** GET /resources — public search by text, category, subject and exact tag. */
export function listResources(params = {}) {
  return apiClient.get(endpoints.resources.list, { params: cleanParams(params) });
}

/** GET /resources/{id} */
export function getResource(id) {
  return apiClient.get(endpoints.resources.byId(id));
}

/** GET /resources/mine — requires a session. */
export function listMyResources() {
  return apiClient.get(endpoints.resources.mine);
}

/** POST /resources — multipart fields; the browser sets the boundary. */
export function uploadResource(data, { onProgress } = {}) {
  return uploadFile(endpoints.resources.upload, data, { onProgress });
}

/** PUT /resources/{id} — uploader or admin. */
export function updateResource(id, metadata) {
  return apiClient.put(endpoints.resources.byId(id), metadata);
}

/** DELETE /resources/{id} — uploader or admin. */
export function deleteResource(id) {
  return apiClient.delete(endpoints.resources.byId(id));
}

/**
 * GET /resources/{id}/download
 * The filename comes from Content-Disposition; `originalFileName` is only a fallback.
 */
export function downloadResource(resource) {
  if (!resource?.id) {
    return Promise.reject(new Error('This resource has no download address.'));
  }
  return downloadAndSave(
    endpoints.resources.download(resource.id),
    resource.originalFileName || resource.title || 'fusionv-resource',
  );
}
