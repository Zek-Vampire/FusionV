import axios from 'axios';
import { readToken } from '@/lib/storage';
import { normalizeApiError } from '@/lib/errors';

export const DEFAULT_API_BASE_URL = '/api/v1';
export const UNAUTHORIZED_EVENT = 'fusionv:unauthorized';

export function resolveApiBaseUrl(value) {
  const raw = String(value || DEFAULT_API_BASE_URL).trim();
  const trimmed = raw.replace(/\/+$/, '');
  return trimmed || DEFAULT_API_BASE_URL;
}

/**
 * VITE_API_BASE_URL is "/api/v1" by default, so the Vite proxy handles the backend
 * address in development and a same-origin reverse proxy can handle it in production.
 */
export const API_BASE_URL = resolveApiBaseUrl(import.meta.env?.VITE_API_BASE_URL);

/** "http://localhost:8080/api/v1" -> "http://localhost:8080"; "/api/v1" -> "". */
export const SERVER_ROOT = API_BASE_URL.replace(/\/api\/v1$/, '');

/**
 * The API returns relative download paths such as "/api/v1/resources/4/download".
 * They must not be treated as absolute URLs on a different origin.
 * This matches the legacy helper: any leading-slash path is relative to the server root.
 */
export function absoluteServerUrl(url) {
  const value = String(url || '');
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/')) return `${SERVER_ROOT}${value}`;
  return `${API_BASE_URL}/${value.replace(/^\/+/, '')}`;
}

export function filenameFromDisposition(header, fallback = 'fusionv-download') {
  if (!header) return fallback;

  // Spring's ContentDisposition.attachment().filename(name, UTF_8) emits filename*=UTF-8''…
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (utf8) {
    try {
      return decodeURIComponent(utf8[1].trim());
    } catch {
      /* fall through to the ASCII filename */
    }
  }

  const plain = /filename="?([^";]+)"?/i.exec(header);
  return plain ? plain[1].trim() : fallback;
}

function responseHeader(headers, name) {
  if (!headers) return '';
  if (typeof headers.get === 'function') return headers.get(name) || '';
  return headers[name] ?? headers[name.toLowerCase()] ?? '';
}

function emitUnauthorized(error) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(UNAUTHORIZED_EVENT, {
      detail: { message: error?.message || 'Your session expired. Please log in again.' },
    }),
  );
}

function attachRequestAuth(instance, getToken) {
  instance.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
}

/**
 * Creates a JSON API client. Exported as a factory so tests can inject an adapter,
 * a token getter and an unauthorized handler.
 *
 * Successful responses resolve to `response.data`; 204 resolves to `null`.
 * Every failure rejects with an ApiError.
 */
export function createApiClient({
  baseURL = API_BASE_URL,
  getToken = readToken,
  onUnauthorized = emitUnauthorized,
  adapter,
  timeout = 20_000,
} = {}) {
  const instance = axios.create({
    baseURL,
    timeout,
    adapter,
    headers: { Accept: 'application/json' },
  });

  attachRequestAuth(instance, getToken);

  instance.interceptors.response.use(
    (response) => (response.status === 204 ? null : response.data),
    (error) => {
      const hadToken = Boolean(getToken());
      const normalized = normalizeApiError(error);
      // Only an authenticated request can expire. A failed login must not redirect.
      // 403 is an authorisation problem, not an expiry: the session stays valid.
      if (normalized.status === 401 && hadToken) {
        onUnauthorized(normalized);
      }
      return Promise.reject(normalized);
    },
  );

  return instance;
}

/**
 * Full-response client used for file transfers, where headers and the raw body matter.
 * Errors are still normalised; a JSON error body returned as a Blob is decoded first.
 */
export function createRawApiClient({
  baseURL = API_BASE_URL,
  getToken = readToken,
  onUnauthorized = emitUnauthorized,
  adapter,
} = {}) {
  const instance = axios.create({
    baseURL,
    adapter,
    headers: { Accept: 'application/json' },
  });

  attachRequestAuth(instance, getToken);

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const hadToken = Boolean(getToken());
      let normalized = normalizeApiError(error);
      const response = error && typeof error === 'object' ? error.response : null;

      // Download endpoints return JSON errors as a Blob, which has no message/fieldErrors.
      if (response && typeof Blob !== 'undefined' && response.data instanceof Blob) {
        try {
          const text = await response.data.text();
          if (text) {
            normalized = normalizeApiError({
              code: error.code,
              response: { ...response, data: JSON.parse(text) },
            });
          }
        } catch {
          /* keep the status-based message */
        }
      }

      if (normalized.status === 401 && hadToken) {
        onUnauthorized(normalized);
      }
      return Promise.reject(normalized);
    },
  );

  return instance;
}

export function saveBlob(blob, filename) {
  if (typeof document === 'undefined' || typeof URL?.createObjectURL !== 'function') return;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/**
 * Uploads/downloads use the endpoints the backend already exposes:
 *   POST /resources, POST /users/me/resume  (multipart field "file")
 *   GET  /resources/{id}/download, GET /users/me/resume, GET /users/me/export
 */
export function createFileTransfer({
  baseURL = API_BASE_URL,
  getToken = readToken,
  onUnauthorized = emitUnauthorized,
  adapter,
} = {}) {
  const client = createRawApiClient({ baseURL, getToken, onUnauthorized, adapter });

  async function upload(path, formData, { onProgress, signal, timeout = 120_000 } = {}) {
    // Never set Content-Type for FormData: the browser must add the multipart boundary.
    const response = await client.post(path, formData, {
      timeout,
      signal,
      headers: { Accept: 'application/json' },
      onUploadProgress: (event) => {
        if (typeof onProgress !== 'function') return;
        const total = event.total ?? 0;
        if (!total) return;
        onProgress(Math.min(100, Math.round((event.loaded / total) * 100)));
      },
    });
    return response.status === 204 ? null : response.data;
  }

  async function download(path, fallbackName) {
    // Large files must not inherit the JSON client's 20s timeout. Downloads also
    // accept any representation: the profile export is text/plain, so the raw
    // client's JSON Accept header would make Spring reject it during negotiation.
    const response = await client.get(path, {
      responseType: 'blob',
      timeout: 0,
      headers: { Accept: '*/*' },
    });
    return {
      blob: response.data,
      filename: filenameFromDisposition(
        responseHeader(response.headers, 'content-disposition'),
        fallbackName,
      ),
    };
  }

  return { upload, download };
}

export const apiClient = createApiClient();
export const fileTransfer = createFileTransfer();

export const uploadFile = (...args) => fileTransfer.upload(...args);
export const downloadFile = (...args) => fileTransfer.download(...args);

export async function downloadAndSave(path, fallbackName) {
  const result = await downloadFile(path, fallbackName);
  saveBlob(result.blob, result.filename);
  return result;
}
