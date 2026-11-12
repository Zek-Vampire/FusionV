/**
 * Session storage adapter.
 *
 * This deliberately mirrors the behaviour of the existing frontend:
 *   - "Keep me signed in" -> localStorage, otherwise sessionStorage
 *   - a persistent token takes precedence over a tab-only token
 *   - the remembered email is only kept when the user asked to be remembered
 *
 * The JWT is stored in web storage, exactly as the current app does. The backend
 * has no refresh/logout endpoint, so the client owns the session lifecycle.
 */

export const SESSION_KEYS = {
  token: 'fusionv_token',
  userId: 'fusionv_user_id',
  email: 'fusionv_email',
};

function safeGet(store, key) {
  try {
    return store.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(store, key, value) {
  try {
    store.setItem(key, value);
  } catch {
    /* private mode / quota: the app still works for this tab */
  }
}

function safeRemove(store, key) {
  try {
    store.removeItem(key);
  } catch {
    /* ignore */
  }
}

function local() {
  return window.localStorage;
}

function tab() {
  return window.sessionStorage;
}

export function readToken() {
  return safeGet(local(), SESSION_KEYS.token) || safeGet(tab(), SESSION_KEYS.token);
}

export function isPersistentSession() {
  return Boolean(safeGet(local(), SESSION_KEYS.token));
}

export function readUserId() {
  const raw = safeGet(local(), SESSION_KEYS.userId) || safeGet(tab(), SESSION_KEYS.userId);
  const id = Number(raw);
  return raw !== null && !Number.isNaN(id) ? id : null;
}

export function readRememberedEmail() {
  return safeGet(local(), SESSION_KEYS.email);
}

/**
 * Stores a new session, clearing any previous one first so a tab-only token can
 * never shadow a persistent one.
 */
export function saveSession({ token, userId, remember = false }) {
  clearSession();
  const store = remember ? local() : tab();
  safeSet(store, SESSION_KEYS.token, token);
  if (userId !== undefined && userId !== null) {
    safeSet(store, SESSION_KEYS.userId, String(userId));
  }
}

/** Removes the token and user id, keeping the remembered email. */
export function clearSession() {
  safeRemove(local(), SESSION_KEYS.token);
  safeRemove(tab(), SESSION_KEYS.token);
  safeRemove(local(), SESSION_KEYS.userId);
  safeRemove(tab(), SESSION_KEYS.userId);
}

/** Logout / expired session: removes the token, user id and remembered email. */
export function clearAllSession() {
  clearSession();
  safeRemove(local(), SESSION_KEYS.email);
}

export function rememberEmail(email) {
  if (email) {
    safeSet(local(), SESSION_KEYS.email, email);
  } else {
    safeRemove(local(), SESSION_KEYS.email);
  }
}
