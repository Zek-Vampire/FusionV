import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchCurrentUser, login as loginRequest, register as registerRequest } from '@/services/auth';
import { UNAUTHORIZED_EVENT } from '@/services/api/client';
import { clearAllSession, readToken, rememberEmail, saveSession, SESSION_KEYS } from '@/lib/storage';
import { ApiError } from '@/lib/errors';

export const AuthContext = createContext(null);

export const AUTH_STATUS = {
  idle: 'idle',
  checking: 'checking',
  authenticated: 'authenticated',
  anonymous: 'anonymous',
  error: 'error',
};

const initialState = {
  status: AUTH_STATUS.idle,
  user: null,
  error: null,
  notice: null,
};

/**
 * Owns the JWT session lifecycle, mirroring the existing frontend:
 * boot with GET /users/me, clear on 401, keep tab-only vs persistent storage,
 * and react to logout in another tab.
 */
export function AuthProvider({ children }) {
  const [state, setState] = useState(initialState);
  const [bootAttempt, setBootAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      if (!readToken()) {
        if (!cancelled) {
          setState({ status: AUTH_STATUS.anonymous, user: null, error: null, notice: null });
        }
        return;
      }

      setState({ status: AUTH_STATUS.checking, user: null, error: null, notice: null });

      try {
        const user = await fetchCurrentUser();
        if (!cancelled) {
          setState({ status: AUTH_STATUS.authenticated, user, error: null, notice: null });
        }
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 401) {
          clearAllSession();
          setState({
            status: AUTH_STATUS.anonymous,
            user: null,
            error: null,
            notice: 'Your session expired. Please log in again.',
          });
        } else {
          // A server/network problem is not a logout: keep the token and offer a retry.
          setState({ status: AUTH_STATUS.error, user: null, error, notice: null });
        }
      }
    }

    boot();
    return () => {
      cancelled = true;
    };
  }, [bootAttempt]);

  useEffect(() => {
    function handleUnauthorized(event) {
      clearAllSession();
      setState((previous) => {
        if (previous.status === AUTH_STATUS.anonymous && previous.notice) {
          return previous;
        }
        return {
          status: AUTH_STATUS.anonymous,
          user: null,
          error: null,
          notice: event?.detail?.message || 'Your session expired. Please log in again.',
        };
      });
    }

    function handleStorage(event) {
      if (event.key !== SESSION_KEYS.token || readToken()) return;
      // Only a tab that had a session needs to react; an anonymous tab has nothing to clear.
      setState((previous) => {
        if (
          previous.status !== AUTH_STATUS.authenticated &&
          previous.status !== AUTH_STATUS.checking &&
          previous.status !== AUTH_STATUS.error
        ) {
          return previous;
        }
        return {
          status: AUTH_STATUS.anonymous,
          user: null,
          error: null,
          notice: 'You were logged out in another tab.',
        };
      });
    }

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const signIn = useCallback(async ({ email, password, remember = false }) => {
    const result = await loginRequest({ email, password });
    saveSession({ token: result.token, userId: result.user?.id, remember });
    rememberEmail(remember ? email : '');
    setState({ status: AUTH_STATUS.authenticated, user: result.user, error: null, notice: null });
    return result.user;
  }, []);

  const signUp = useCallback(async ({ fullName, email, password, remember = true }) => {
    const result = await registerRequest({ fullName, email, password });
    saveSession({ token: result.token, userId: result.user?.id, remember });
    rememberEmail(remember ? email : '');
    setState({ status: AUTH_STATUS.authenticated, user: result.user, error: null, notice: null });
    return result.user;
  }, []);

  const logout = useCallback(() => {
    clearAllSession();
    setState({ status: AUTH_STATUS.anonymous, user: null, error: null, notice: null });
  }, []);

  const retrySession = useCallback(() => {
    setBootAttempt((attempt) => attempt + 1);
  }, []);

  /** Keeps the shell and every consumer in sync after a profile mutation. */
  const updateUser = useCallback((user) => {
    setState((previous) => ({
      ...previous,
      status: user ? AUTH_STATUS.authenticated : previous.status,
      user: user || previous.user,
      error: null,
    }));
  }, []);

  const clearNotice = useCallback(() => {
    setState((previous) => (previous.notice ? { ...previous, notice: null } : previous));
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      isAuthenticated: state.status === AUTH_STATUS.authenticated,
      signIn,
      signUp,
      logout,
      retrySession,
      clearNotice,
      updateUser,
    }),
    [state, signIn, signUp, logout, retrySession, clearNotice, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
}
