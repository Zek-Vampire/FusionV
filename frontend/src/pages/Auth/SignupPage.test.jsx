import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import SignupPage from './SignupPage';

function SignupRoute() {
  return (
    <Routes>
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/teams" element={<p>teams destination</p>} />
    </Routes>
  );
}

describe('SignupPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('enforces the backend password rule before submitting', async () => {
    const user = userEvent.setup();
    const signUp = vi.fn();
    renderWithProviders(<SignupRoute />, { initialEntries: ['/signup'], auth: { signUp } });

    await user.type(screen.getByLabelText('Full name'), 'Priya Nair');
    await user.type(screen.getByLabelText('Email address'), 'priya@college.edu');
    await user.type(screen.getByLabelText('Password'), 'short');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(
      await screen.findByText('Use at least 8 characters including a letter and a digit.'),
    ).toBeInTheDocument();
    expect(signUp).not.toHaveBeenCalled();
  });

  it('creates the account and navigates to the requested next path', async () => {
    const user = userEvent.setup();
    const signUp = vi.fn().mockResolvedValue({ fullName: 'Priya Nair' });
    renderWithProviders(<SignupRoute />, {
      initialEntries: ['/signup?next=%2Fteams'],
      auth: { signUp },
    });

    await user.type(screen.getByLabelText('Full name'), 'Priya Nair');
    await user.type(screen.getByLabelText('Email address'), 'priya@college.edu');
    await user.type(screen.getByLabelText('Password'), 'fusionv1');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() =>
      expect(signUp).toHaveBeenCalledWith({
        fullName: 'Priya Nair',
        email: 'priya@college.edu',
        password: 'fusionv1',
        remember: false,
      }),
    );
    expect(await screen.findByText('teams destination')).toBeInTheDocument();
  });

  it('displays a duplicate-email error from the API', async () => {
    const user = userEvent.setup();
    const signUp = vi.fn().mockRejectedValue({
      message: 'An account with this email already exists',
      fieldErrors: {},
    });
    renderWithProviders(<SignupRoute />, { initialEntries: ['/signup'], auth: { signUp } });

    await user.type(screen.getByLabelText('Full name'), 'Priya Nair');
    await user.type(screen.getByLabelText('Email address'), 'priya@college.edu');
    await user.type(screen.getByLabelText('Password'), 'fusionv1');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('An account with this email already exists')).toBeInTheDocument();
  });
});
