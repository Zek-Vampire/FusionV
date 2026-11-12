import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/errors';
import {
  absoluteServerUrl,
  createApiClient,
  createFileTransfer,
  filenameFromDisposition,
  resolveApiBaseUrl,
} from './client';

function readHeader(config, name) {
  const headers = config?.headers;
  if (!headers) return undefined;
  if (typeof headers.get === 'function') return headers.get(name);
  return headers[name] ?? headers[name.toLowerCase()];
}

/** Minimal axios adapter so the client's interceptors can be tested without a server. */
function adapterFrom(handler) {
  return async (config) => {
    const result = handler(config) || {};
    const response = {
      data: result.data,
      status: result.status ?? 200,
      statusText: result.statusText ?? 'OK',
      headers: result.headers ?? {},
      config,
    };

    if (response.status >= 200 && response.status < 300) {
      return response;
    }

    const error = new Error(`Request failed with status code ${response.status}`);
    error.isAxiosError = true;
    error.config = config;
    error.response = response;
    throw error;
  };
}

describe('api base url', () => {
  it('defaults to the relative /api/v1 path and strips trailing slashes', () => {
    expect(resolveApiBaseUrl()).toBe('/api/v1');
    expect(resolveApiBaseUrl('/api/v1///')).toBe('/api/v1');
    expect(resolveApiBaseUrl('http://localhost:8080/api/v1/')).toBe(
      'http://localhost:8080/api/v1',
    );
  });

  it('resolves relative download paths without treating them as another origin', () => {
    expect(absoluteServerUrl('/api/v1/resources/4/download')).toBe('/api/v1/resources/4/download');
    expect(absoluteServerUrl('https://cdn.example.com/file.pdf')).toBe(
      'https://cdn.example.com/file.pdf',
    );
    expect(absoluteServerUrl('resources/4/download')).toBe('/api/v1/resources/4/download');
  });
});

describe('filenameFromDisposition', () => {
  it('decodes the UTF-8 filename emitted by Spring', () => {
    expect(
      filenameFromDisposition("attachment; filename=\"cafe.pdf\"; filename*=UTF-8''caf%C3%A9.pdf"),
    ).toBe('café.pdf');
  });

  it('falls back to the ASCII filename and then to the provided default', () => {
    expect(filenameFromDisposition('attachment; filename="notes.txt"')).toBe('notes.txt');
    expect(filenameFromDisposition('', 'fallback.bin')).toBe('fallback.bin');
  });
});

describe('createApiClient', () => {
  it('resolves with the response body and attaches the bearer token', async () => {
    let seen;
    const client = createApiClient({
      getToken: () => 'jwt-token',
      adapter: adapterFrom((config) => {
        seen = config;
        return { data: { id: 1, fullName: 'Student' } };
      }),
    });

    await expect(client.get('/users/me')).resolves.toEqual({ id: 1, fullName: 'Student' });
    expect(readHeader(seen, 'Authorization')).toBe('Bearer jwt-token');
  });

  it('sends no Authorization header without a token', async () => {
    let seen;
    const client = createApiClient({
      getToken: () => null,
      adapter: adapterFrom((config) => {
        seen = config;
        return { data: { students: 0 } };
      }),
    });

    await client.get('/public/stats');
    expect(readHeader(seen, 'Authorization')).toBeUndefined();
  });

  it('resolves 204 responses to null', async () => {
    const client = createApiClient({
      getToken: () => 'jwt-token',
      adapter: adapterFrom(() => ({ data: '', status: 204, statusText: 'No Content' })),
    });

    await expect(client.delete('/resources/3')).resolves.toBeNull();
  });

  it('rejects with an ApiError carrying status and field errors', async () => {
    const client = createApiClient({
      getToken: () => null,
      adapter: adapterFrom(() => ({
        status: 400,
        data: {
          message: 'Please correct the highlighted fields',
          fieldErrors: { email: 'must not be blank' },
        },
      })),
    });

    await expect(client.post('/auth/register', {})).rejects.toMatchObject({
      status: 400,
      message: 'must not be blank',
      fieldErrors: { email: 'must not be blank' },
    });
  });

  it('notifies the session handler when an authenticated request expires', async () => {
    const onUnauthorized = vi.fn();
    const client = createApiClient({
      getToken: () => 'expired-token',
      onUnauthorized,
      adapter: adapterFrom(() => ({
        status: 401,
        data: { status: 401, error: 'Unauthorized', message: 'Please log in first' },
      })),
    });

    await expect(client.get('/users/me')).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(onUnauthorized.mock.calls[0][0].status).toBe(401);
  });

  it('does not notify the session handler when a login attempt fails', async () => {
    const onUnauthorized = vi.fn();
    const client = createApiClient({
      getToken: () => null,
      onUnauthorized,
      adapter: adapterFrom(() => ({
        status: 401,
        data: { status: 401, error: 'Unauthorized', message: 'Invalid email or password' },
      })),
    });

    await expect(client.post('/auth/login', {})).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('does not log out on a 403', async () => {
    const onUnauthorized = vi.fn();
    const client = createApiClient({
      getToken: () => 'valid-token',
      onUnauthorized,
      adapter: adapterFrom(() => ({
        status: 403,
        data: { status: 403, error: 'Forbidden', message: 'You are not allowed to do this' },
      })),
    });

    await expect(client.delete('/posts/9')).rejects.toMatchObject({
      status: 403,
      message: 'You are not allowed to do this',
    });
    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});

describe('createFileTransfer', () => {
  it('uploads FormData without forcing a JSON content type and reports progress', async () => {
    let seen;
    const onProgress = vi.fn();
    const transfer = createFileTransfer({
      getToken: () => 'jwt-token',
      adapter: adapterFrom((config) => {
        seen = config;
        config.onUploadProgress?.({ loaded: 5, total: 10 });
        return { data: { id: 12 }, status: 200 };
      }),
    });

    const form = new FormData();
    form.append('file', new Blob(['hello'], { type: 'application/pdf' }), 'notes.pdf');
    form.append('title', 'Notes');

    await expect(transfer.upload('/resources', form, { onProgress })).resolves.toEqual({ id: 12 });

    expect(seen.data).toBe(form);
    expect(readHeader(seen, 'Content-Type')).not.toBe('application/json');
    expect(readHeader(seen, 'Authorization')).toBe('Bearer jwt-token');
    expect(onProgress).toHaveBeenCalledWith(50);
  });

  it('downloads a blob and keeps the server filename', async () => {
    const blob = new Blob(['pdf-bytes'], { type: 'application/pdf' });
    let seen;
    const transfer = createFileTransfer({
      getToken: () => 'jwt-token',
      adapter: adapterFrom((config) => {
        seen = config;
        return {
          data: blob,
          status: 200,
          headers: { 'content-disposition': "attachment; filename*=UTF-8''caf%C3%A9.pdf" },
        };
      }),
    });

    const result = await transfer.download('/resources/4/download');

    expect(result.blob).toBe(blob);
    expect(result.filename).toBe('café.pdf');
    expect(readHeader(seen, 'Accept')).toBe('*/*');
  });

  it('notifies the session handler when a download is unauthorized', async () => {
    const onUnauthorized = vi.fn();
    const transfer = createFileTransfer({
      getToken: () => 'expired',
      onUnauthorized,
      adapter: adapterFrom(() => ({
        status: 401,
        data: new Blob([JSON.stringify({ message: 'Please log in first' })], {
          type: 'application/json',
        }),
        headers: { 'content-type': 'application/json' },
      })),
    });

    await expect(transfer.download('/users/me/resume')).rejects.toMatchObject({ status: 401 });
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });
});
