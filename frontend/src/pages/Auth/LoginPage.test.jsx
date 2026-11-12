import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import LoginPage from './LoginPage';

function LoginRoute() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/hackathons" element={<p>hackathons destination</p>} />
    </Routes>
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('validates the fields before calling the API', async () => {
    const user = userEvent.setup();
    const signIn = vi.fn();
    renderWithProviders(<LoginRoute />, { initialEntries: ['/login'], auth: { signIn } });

    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
    expect(screen.getByText('Enter your password.')).toBeInTheDocument();
    expect(signIn).not.toHaveBeenCalled();
  });

  it('shows the real backend validation error and field errors', async () => {
    const user = userEvent.setup();
    const signIn = vi.fn().mockRejectedValue({
      message: 'Please correct the highlighted fields',
      fieldErrors: { email: 'must be a well-formed email address' },
    });
    renderWithProviders(<LoginRoute />, { initialEntries: ['/login'], auth: { signIn } });

    await user.type(screen.getByLabelText('Email address'), 'student@college.edu');
    await user.type(screen.getByLabelText('Password'), 'secret1');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('Please correct the highlighted fields')).toBeInTheDocument();
    expect(screen.getByText('must be a well-formed email address')).toBeInTheDocument();
  });

  it('signs in with remember-me and returns to the next path', async () => {
    const user = userEvent.setup();
    const signIn = vi.fn().mockResolvedValue({ fullName: 'Priya Nair' });
    renderWithProviders(<LoginRoute />, {
      initialEntries: ['/login?next=%2Fhackathons'],
      auth: { signIn },
    });

    await user.type(screen.getByLabelText('Email address'), 'student@college.edu');
    await user.type(screen.getByLabelText('Password'), 'secret1');
    await user.click(screen.getByLabelText(/Keep me signed in/));
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() =>
      expect(signIn).toHaveBeenCalledWith({
        email: 'student@college.edu',
        password: 'secret1',
        remember: true,
      }),
    );
    expect(await screen.findByText('hackathons destination')).toBeInTheDocument();
  });
});
