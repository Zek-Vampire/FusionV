import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { getMyStats } from '@/services/users';
import { listMyInvitations, listTeams } from '@/services/teams';
import { listNotifications } from '@/services/notifications';
import { listHackathons } from '@/services/hackathons';
import { listResources } from '@/services/resources';
import DashboardPage from './DashboardPage';

vi.mock('@/services/users', () => ({ getMyStats: vi.fn() }));
vi.mock('@/services/teams', () => ({
  listTeams: vi.fn(),
  listMyInvitations: vi.fn(),
}));
vi.mock('@/services/notifications', () => ({ listNotifications: vi.fn() }));
vi.mock('@/services/hackathons', () => ({ listHackathons: vi.fn() }));
vi.mock('@/services/resources', () => ({ listResources: vi.fn() }));

const USER = {
  id: 1,
  fullName: 'Aarav Shah',
  skills: ['Java', 'SQL'],
  interests: ['Open Source'],
};

beforeEach(() => {
  vi.clearAllMocks();
  getMyStats.mockResolvedValue({ teamsJoined: 2, posts: 4, resourcesShared: 1, hackathons: 1 });
  listTeams.mockResolvedValue([
    {
      id: 4,
      name: 'CodeCrafters',
      hackathonName: 'Campus Hack',
      memberCount: 3,
      maxMembers: 5,
      myStatus: 'LEADER',
    },
  ]);
  listMyInvitations.mockResolvedValue([
    { id: 9, teamId: 7, teamName: 'Byte Builders', status: 'PENDING', createdAt: '2026-11-09T10:00:00' },
  ]);
  listNotifications.mockResolvedValue([
    {
      id: 1,
      type: 'NEW_MESSAGE',
      message: 'New message in CodeCrafters',
      read: false,
      createdAt: '2026-11-10T10:00:00',
    },
  ]);
  listHackathons.mockResolvedValue([
    { id: 2, name: 'Campus Hack', startDate: '2026-12-01', endDate: '2026-12-02', mode: 'ONLINE' },
  ]);
  listResources.mockResolvedValue([
    { id: 3, title: 'DBMS Notes', subject: 'DBMS', uploaderName: 'Priya', downloadCount: 12 },
  ]);
});

describe('DashboardPage', () => {
  it('composes real stats, teams, invitations, notifications and resources', async () => {
    renderWithProviders(<DashboardPage />, { auth: { user: USER, isAuthenticated: true } });

    expect(screen.getByRole('heading', { name: 'Welcome back, Aarav' })).toBeInTheDocument();
    expect(await screen.findByText('CodeCrafters')).toBeInTheDocument();
    expect(screen.getByText('Byte Builders')).toBeInTheDocument();
    expect(screen.getByText('New message in CodeCrafters')).toBeInTheDocument();
    expect(screen.getAllByText('Campus Hack').length).toBeGreaterThan(0);
    expect(screen.getByText('DBMS Notes')).toBeInTheDocument();
    expect(screen.getByText('Teams joined')).toBeInTheDocument();
  });

  it('isolates a failed section and retries that request', async () => {
    const user = userEvent.setup();
    listTeams.mockRejectedValueOnce(new Error('Teams service unavailable'));

    renderWithProviders(<DashboardPage />, { auth: { user: USER, isAuthenticated: true } });

    expect(await screen.findByText('Teams service unavailable')).toBeInTheDocument();
    const retryButtons = screen.getAllByRole('button', { name: 'Retry' });
    await user.click(retryButtons[0]);
    expect(await screen.findByText('CodeCrafters')).toBeInTheDocument();
  });

  it('shows empty states when the account has no team or notifications', async () => {
    listTeams.mockResolvedValue([]);
    listNotifications.mockResolvedValue([]);
    renderWithProviders(<DashboardPage />, { auth: { user: USER, isAuthenticated: true } });

    expect(await screen.findByText('You are not in a team yet.')).toBeInTheDocument();
    expect(screen.getByText('You have no notifications yet.')).toBeInTheDocument();
  });
});
