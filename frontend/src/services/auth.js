import { apiClient } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';

/** POST /auth/login — returns { token, user }. */
export function login({ email, password }) {
  return apiClient.post(endpoints.auth.login, { email, password });
}

/** POST /auth/register — returns { token, user } and signs the user in. */
export function register({ fullName, email, password }) {
  return apiClient.post(endpoints.auth.register, { fullName, email, password });
}

/** GET /users/me — validates the stored token and returns the full profile. */
export function fetchCurrentUser() {
  return apiClient.get(endpoints.users.me);
}
