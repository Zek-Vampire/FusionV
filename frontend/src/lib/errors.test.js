import { describe, expect, it } from 'vitest';
import { ApiError, normalizeApiError } from './errors';

describe('normalizeApiError', () => {
  it('prefers the first field error and keeps the whole field-error map', () => {
    const error = normalizeApiError({
      response: {
        status: 400,
        data: {
          message: 'Please correct the highlighted fields',
          fieldErrors: { email: 'must be a well-formed email address', password: 'too short' },
        },
      },
    });

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
    expect(error.message).toBe('must be a well-formed email address');
    expect(error.fieldErrors).toEqual({
      email: 'must be a well-formed email address',
      password: 'too short',
    });
  });

  it('reads the Spring Security shape that has no fieldErrors or timestamp', () => {
    const error = normalizeApiError({
      response: { status: 401, data: { status: 401, error: 'Unauthorized', message: 'Please log in first' } },
    });

    expect(error.status).toBe(401);
    expect(error.isUnauthorized).toBe(true);
    expect(error.message).toBe('Please log in first');
    expect(error.fieldErrors).toEqual({});
  });

  it('uses a plain text error body when the API returns non-JSON', () => {
    const error = normalizeApiError({ response: { status: 502, data: 'Bad gateway' } });

    expect(error.status).toBe(502);
    expect(error.message).toBe('Bad gateway');
  });

  it('reports a network failure with status 0', () => {
    const error = normalizeApiError({ code: 'ERR_NETWORK', message: 'Network Error' });

    expect(error.status).toBe(0);
    expect(error.isNetworkError).toBe(true);
    expect(error.message).toMatch(/Cannot reach the FusionV server/);
  });

  it('reports a timeout distinctly', () => {
    const error = normalizeApiError({ code: 'ECONNABORTED' });

    expect(error.status).toBe(0);
    expect(error.message).toMatch(/took too long/);
  });

  it('falls back to the HTTP status when no message exists', () => {
    const error = normalizeApiError({ response: { status: 500, data: {} } });

    expect(error.status).toBe(500);
    expect(error.message).toBe('Request failed (500)');
  });

  it('returns an existing ApiError unchanged', () => {
    const original = new ApiError('Already normalised', { status: 403 });

    expect(normalizeApiError(original)).toBe(original);
  });
});
