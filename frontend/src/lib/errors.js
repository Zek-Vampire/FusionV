/**
 * Normalises every failure to one typed error.
 *
 * The backend has two error body shapes:
 *   1. GlobalExceptionHandler: {timestamp,status,error,message,fieldErrors}
 *   2. Spring Security:        {status,error,message}   (no fieldErrors)
 * A client that assumes only one of them loses validation messages, so both are handled here.
 */

export class ApiError extends Error {
  constructor(message, { status = 0, fieldErrors = {}, data = null, cause = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.data = data;
    this.cause = cause;
  }

  get isNetworkError() {
    return this.status === 0;
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  get isForbidden() {
    return this.status === 403;
  }

  get isNotFound() {
    return this.status === 404;
  }
}

const NETWORK_MESSAGE =
  'Cannot reach the FusionV server. Check your connection or ask an administrator whether the API is running.';

function isFieldErrors(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/**
 * @param {unknown} error an Axios error, a thrown ApiError, or anything else
 * @returns {ApiError}
 */
export function normalizeApiError(error) {
  if (error instanceof ApiError) {
    return error;
  }

  const response = error && typeof error === 'object' ? error.response : null;
  const code = error && typeof error === 'object' ? error.code : null;

  if (!response) {
    const message =
      code === 'ECONNABORTED' ? 'The request took too long. Please try again.' : NETWORK_MESSAGE;
    return new ApiError(message, { status: 0, cause: error });
  }

  const status = Number(response.status) || 0;
  const data = response.data;
  let message = `Request failed (${status})`;
  let fieldErrors = {};

  if (data && typeof data === 'object') {
    if (isFieldErrors(data.fieldErrors)) {
      fieldErrors = data.fieldErrors;
    }
    const firstField = Object.keys(fieldErrors)[0];
    message = (firstField && fieldErrors[firstField]) || data.message || message;
  } else if (typeof data === 'string' && data.trim()) {
    message = data.trim().slice(0, 300);
  }

  return new ApiError(message, { status, fieldErrors, data, cause: error });
}
