import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { changePassword, downloadProfileExport } from '@/services/users';
import SettingsPage from './SettingsPage';

vi.mock('@/services/users', () => ({
  changePassword: vi.fn(),
  downloadProfileExport: vi.fn(),
}));

const USER = {
  id: 1,
  fullName: 'Aarav Shah',
  email: 'aarav@college.edu',
  role: 'STUDENT',
  createdAt: '2026-01-15T10:00:00',
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  changePassword.mockResolvedValue(null);
  downloadProfileExport.mockResolvedValue({ filename: 'fusionv-profile.txt' });
});

function renderSettings() {
  return renderWithProviders(<SettingsPage />, {
    auth: { user: USER, isAuthenticated: true },
  });
}

describe('SettingsPage', () => {
  it('shows account facts and clearly unavailable preferences', () => {
    renderSettings();

    expect(screen.getByText('Aarav Shah')).toBeInTheDocument();
    expect(screen.getByText('aarav@college.edu')).toBeInTheDocument();
    expect(screen.getByText('Student')).toBeInTheDocument();
    expect(
      screen.getByText(/Per-notification preferences and privacy toggles are not available/i),
    ).toBeInTheDocument();
  });

  it('validates the password form before calling the API', async () => {
    const user = userEvent.setup();
    renderSettings();

    await user.type(screen.getByLabelText('Current password'), 'old-pass1');
    await user.type(screen.getByLabelText('New password'), 'short');
    await user.type(screen.getByLabelText('Confirm new password'), 'different');
    await user.click(screen.getByRole('button', { name: 'Change password' }));

    expect(
      await screen.findByText('Use at least 8 characters including a letter and a digit.'),
    ).toBeInTheDocument();
    expect(screen.getByText('The two new passwords do not match.')).toBeInTheDocument();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it('submits a valid password and reports backend field errors', async () => {
    const user = userEvent.setup();
    changePassword.mockRejectedValue({
      message: 'Please correct the highlighted fields',
      fieldErrors: { currentPassword: 'Current password is incorrect' },
    });
    renderSettings();

    await user.type(screen.getByLabelText('Current password'), 'wrong-pass1');
    await user.type(screen.getByLabelText('New password'), 'new-pass123');
    await user.type(screen.getByLabelText('Confirm new password'), 'new-pass123');
    await user.click(screen.getByRole('button', { name: 'Change password' }));

    await waitFor(() =>
      expect(changePassword).toHaveBeenCalledWith(
        {
          currentPassword: 'wrong-pass1',
          newPassword: 'new-pass123',
        },
        expect.anything(),
      ),
    );
    expect(await screen.findByText('Current password is incorrect')).toBeInTheDocument();
    expect(screen.getByText('Please correct the highlighted fields')).toBeInTheDocument();
  });

  it('downloads the real profile export', async () => {
    const user = userEvent.setup();
    renderSettings();

    await user.click(screen.getByRole('button', { name: 'Download profile export' }));
    await waitFor(() => expect(downloadProfileExport).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('Profile export downloaded')).toBeInTheDocument();
  });
});
