import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearAllSession,
  clearSession,
  isPersistentSession,
  readRememberedEmail,
  readToken,
  readUserId,
  rememberEmail,
  saveSession,
} from './storage';

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe('session storage', () => {
  it('keeps a non-remembered session in sessionStorage only', () => {
    saveSession({ token: 'abc', userId: 7, remember: false });

    expect(window.sessionStorage.getItem('fusionv_token')).toBe('abc');
    expect(window.localStorage.getItem('fusionv_token')).toBeNull();
    expect(readToken()).toBe('abc');
    expect(readUserId()).toBe(7);
    expect(isPersistentSession()).toBe(false);
  });

  it('keeps a remembered session in localStorage and reports it as persistent', () => {
    saveSession({ token: 'persisted', userId: 12, remember: true });

    expect(window.localStorage.getItem('fusionv_token')).toBe('persisted');
    expect(window.sessionStorage.getItem('fusionv_token')).toBeNull();
    expect(isPersistentSession()).toBe(true);
    expect(readUserId()).toBe(12);
  });

  it('prefers the persistent token when both stores contain one', () => {
    window.sessionStorage.setItem('fusionv_token', 'tab-token');
    window.localStorage.setItem('fusionv_token', 'persistent-token');

    expect(readToken()).toBe('persistent-token');
  });

  it('replaces an existing session instead of leaving duplicates behind', () => {
    saveSession({ token: 'first', userId: 1, remember: true });
    saveSession({ token: 'second', userId: 2, remember: false });

    expect(window.localStorage.getItem('fusionv_token')).toBeNull();
    expect(window.sessionStorage.getItem('fusionv_token')).toBe('second');
    expect(readUserId()).toBe(2);
  });

  it('clearSession removes the token but keeps the remembered email', () => {
    saveSession({ token: 'abc', userId: 3, remember: false });
    rememberEmail('student@college.edu');

    clearSession();

    expect(readToken()).toBeNull();
    expect(readUserId()).toBeNull();
    expect(readRememberedEmail()).toBe('student@college.edu');
  });

  it('clearAllSession also removes the remembered email', () => {
    saveSession({ token: 'abc', userId: 3, remember: true });
    rememberEmail('student@college.edu');

    clearAllSession();

    expect(readToken()).toBeNull();
    expect(readUserId()).toBeNull();
    expect(readRememberedEmail()).toBeNull();
  });

  it('removes a remembered email when it is cleared with an empty value', () => {
    rememberEmail('student@college.edu');
    rememberEmail('');

    expect(readRememberedEmail()).toBeNull();
  });
});
