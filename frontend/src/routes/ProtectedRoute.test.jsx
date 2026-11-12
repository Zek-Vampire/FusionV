import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext } from '@/context/AuthContext';
import ProtectedRoute from './ProtectedRoute';

function LoginStub() {
  const location = useLocation();
  return <p>login stub {location.search}</p>;
}

function renderAt({ status, error = null }) {
  const value = {
    status,
    user: null,
    error,
    notice: null,
    isAuthenticated: status === 'authenticated',
    signIn: vi.fn(),
    signUp: vi.fn(),
    logout: vi.fn(),
    retrySession: vi.fn(),
  };

  return render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={['/profile']}>
        <Routes>
          <Route path="/login" element={<LoginStub />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<p>profile content</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('ProtectedRoute', () => {
  it('redirects an anonymous visitor to login with the intended path', () => {
    renderAt({ status: 'anonymous' });

    expect(screen.getByText(/login stub/)).toHaveTextContent('next=%2Fprofile');
  });

  it('renders the protected route for an authenticated user', () => {
    renderAt({ status: 'authenticated' });

    expect(screen.getByText('profile content')).toBeInTheDocument();
  });

  it('shows the session check while the stored token is being verified', () => {
    renderAt({ status: 'checking' });

    expect(screen.getByRole('status')).toHaveTextContent('Checking your session');
  });

  it('offers a real retry when the session check could not reach the server', async () => {
    const user = userEvent.setup();
    renderAt({ status: 'error', error: new Error('Cannot reach the FusionV server.') });

    expect(screen.getByRole('alert')).toHaveTextContent('Could not check your session');

    const retry = screen.getByRole('button', { name: 'Try again' });
    await user.click(retry);

    expect(retry).toBeInTheDocument();
  });
});
