import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { searchStudents } from '@/services/users';
import { listSkills } from '@/services/skills';
import StudentsPage from './StudentsPage';

vi.mock('@/services/users', () => ({ searchStudents: vi.fn() }));
vi.mock('@/services/skills', () => ({ listSkills: vi.fn() }));

const STUDENT = {
  id: 7,
  fullName: 'Priya Nair',
  yearBranch: '3rd year · Computer Engineering',
  college: 'VJTI',
  about: 'Backend developer who likes databases.',
  location: 'Mumbai',
  skills: ['Java', 'SQL'],
  interests: ['Open Source'],
};

beforeEach(() => {
  vi.clearAllMocks();
  searchStudents.mockResolvedValue([STUDENT]);
  listSkills.mockResolvedValue(['Java', 'SQL']);
});

describe('StudentsPage', () => {
  it('searches by name and sends the selected skill filter', async () => {
    const user = userEvent.setup();
    renderWithProviders(<StudentsPage />, { auth: { isAuthenticated: true } });

    expect(await screen.findByRole('link', { name: 'Priya Nair' })).toBeInTheDocument();
    await user.type(screen.getByLabelText('Search students by name'), 'priya');
    await waitFor(() =>
      expect(searchStudents).toHaveBeenLastCalledWith({ q: 'priya', skill: '' }),
    );

    await user.selectOptions(screen.getByLabelText('Skill'), 'SQL');
    await waitFor(() =>
      expect(searchStudents).toHaveBeenLastCalledWith({ q: 'priya', skill: 'SQL' }),
    );
    expect(screen.getByRole('link', { name: 'Priya Nair' })).toHaveAttribute(
      'href',
      '/students/7',
    );
  });

  it('shows a filtered empty state and can clear it', async () => {
    const user = userEvent.setup();
    searchStudents.mockResolvedValue([]);
    renderWithProviders(<StudentsPage />, { auth: { isAuthenticated: true } });

    await user.type(screen.getByLabelText('Search students by name'), 'nobody');
    expect(await screen.findByText('No students match this search')).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'Clear search' })[0]);
    expect(screen.getByLabelText('Search students by name')).toHaveValue('');
  });

  it('shows the API error with a retry action', async () => {
    searchStudents.mockRejectedValue(new Error('Directory unavailable'));
    renderWithProviders(<StudentsPage />, { auth: { isAuthenticated: true } });

    expect(await screen.findByText('Directory unavailable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload students' })).toBeInTheDocument();
  });
});
