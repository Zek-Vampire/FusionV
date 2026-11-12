import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/errors';
import { clearAllSession, readToken, saveSession } from '@/lib/storage';
import { fetchCurrentUser } from '@/services/auth';
import { AuthProvider, useAuth } from './AuthContext';

vi.mock('@/services/auth', () => ({
  fetchCurrentUser: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
}));

function Probe() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="status">{auth.status}</span>
      <span data-testid="notice">{auth.notice || ''}</span>
      <span data-testid="user">{auth.user?.fullName || ''}</span>
    </div>
  );
}

function renderAuth() {
  return render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  vi.mocked(fetchCurrentUser).mockReset();
});

describe('AuthProvider', () => {
  it('clears an expired token on boot and reports the expiry', async () => {
    saveSession({ token: 'expired', userId: 1, remember: false });
    vi.mocked(fetchCurrentUser).mockRejectedValue(new ApiError('Please log in first', { status: 401 }));

    renderAuth();

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('anonymous'));
    expect(readToken()).toBeNull();
    expect(screen.getByTestId('notice')).toHaveTextContent('session expired');
  });

  it('keeps the session on a 403 during boot', async () => {
    saveSession({ token: 'valid', userId: 2, remember: false });
    vi.mocked(fetchCurrentUser).mockRejectedValue(
      new ApiError('You are not allowed to do this', { status: 403 }),
    );

    renderAuth();

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('error'));
    expect(readToken()).toBe('valid');
  });

  it('authenticates with the stored token and user', async () => {
    saveSession({ token: 'valid', userId: 3, remember: true });
    vi.mocked(fetchCurrentUser).mockResolvedValue({ id: 3, fullName: 'Preview Member' });

    renderAuth();

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));
    expect(screen.getByTestId('user')).toHaveTextContent('Preview Member');
  });

  it('logs out when another tab removes the persistent token', async () => {
    saveSession({ token: 'valid', userId: 4, remember: true });
    vi.mocked(fetchCurrentUser).mockResolvedValue({ id: 4, fullName: 'Preview Member' });

    renderAuth();
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));

    act(() => {
      clearAllSession();
      window.dispatchEvent(new StorageEvent('storage', { key: 'fusionv_token', newValue: null }));
    });

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('anonymous'));
    expect(screen.getByTestId('notice')).toHaveTextContent('logged out in another tab');
  });

  it('ignores a token storage event when it is still signed in', async () => {
    saveSession({ token: 'valid', userId: 5, remember: false });
    vi.mocked(fetchCurrentUser).mockResolvedValue({ id: 5, fullName: 'Preview Member' });

    renderAuth();
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'fusionv_token', newValue: 'valid' }));
    });

    expect(screen.getByTestId('status')).toHaveTextContent('authenticated');
  });
});
