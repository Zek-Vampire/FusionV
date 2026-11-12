import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import {
  cancelJoinRequest,
  createTeam,
  listMyInvitations,
  listTeams,
  requestToJoin,
  respondToInvitation,
  updateTeam,
} from '@/services/teams';
import { listSkills } from '@/services/skills';
import { listHackathons } from '@/services/hackathons';
import TeamsPage from './TeamsPage';

vi.mock('@/services/teams', () => ({
  listTeams: vi.fn(),
  listMyInvitations: vi.fn(),
  requestToJoin: vi.fn(),
  cancelJoinRequest: vi.fn(),
  respondToInvitation: vi.fn(),
  createTeam: vi.fn(),
  updateTeam: vi.fn(),
}));
vi.mock('@/services/skills', () => ({ listSkills: vi.fn() }));
vi.mock('@/services/hackathons', () => ({ listHackathons: vi.fn() }));

const USER = { id: 1, fullName: 'Aarav Shah', skills: ['Java'], interests: [] };

const TEAM = {
  id: 4,
  name: 'CodeCrafters',
  description: 'Building a campus app.',
  hackathonId: 2,
  hackathonName: 'Campus Hack',
  leaderId: 9,
  leaderName: 'Priya Nair',
  maxMembers: 5,
  memberCount: 2,
  skills: ['Java'],
  members: [],
  myStatus: 'NONE',
  createdAt: '2026-10-01T10:00:00',
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  listTeams.mockResolvedValue([TEAM]);
  listMyInvitations.mockResolvedValue([]);
  listSkills.mockResolvedValue(['Java', 'SQL']);
  listHackathons.mockResolvedValue([{ id: 2, name: 'Campus Hack' }]);
  requestToJoin.mockResolvedValue({ id: 1 });
  cancelJoinRequest.mockResolvedValue(null);
  respondToInvitation.mockResolvedValue({ id: 1 });
  createTeam.mockResolvedValue({ id: 8, name: 'New team' });
  updateTeam.mockResolvedValue({ id: 8, name: 'New team' });
});

describe('TeamsPage', () => {
  it('lists teams and sends a real join request', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TeamsPage />, { auth: { user: USER, isAuthenticated: true } });

    expect(await screen.findByRole('heading', { name: 'CodeCrafters' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Request to join/i }));

    await waitFor(() => expect(requestToJoin).toHaveBeenCalledWith(4, expect.anything()));
    expect(await screen.findByText('Join request sent')).toBeInTheDocument();
  });

  it('saves a team on this device only and labels it', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TeamsPage />, { auth: { user: USER, isAuthenticated: true } });

    await screen.findByRole('heading', { name: 'CodeCrafters' });
    await user.click(screen.getByRole('button', { name: 'Save team on this device' }));

    expect(JSON.parse(localStorage.getItem('fusionv_saved_teams:1'))).toEqual([4]);
    await user.click(screen.getByRole('tab', { name: /Saved/i }));
    expect(await screen.findByText(/Saved on this device only/i)).toBeInTheDocument();
  });

  it('accepts a pending invitation from the invitations tab', async () => {
    const user = userEvent.setup();
    listMyInvitations.mockResolvedValue([
      {
        id: 12,
        teamId: 7,
        teamName: 'Byte Builders',
        type: 'INVITE',
        status: 'PENDING',
        createdAt: '2026-11-09T10:00:00',
      },
    ]);
    renderWithProviders(<TeamsPage />, { auth: { user: USER, isAuthenticated: true } });

    await user.click(screen.getByRole('tab', { name: /Invitations/i }));
    const card = (await screen.findByText('Byte Builders')).closest('li');
    await user.click(within(card).getByRole('button', { name: 'Accept' }));

    await waitFor(() => expect(respondToInvitation).toHaveBeenCalledWith(12, true));
  });

  it('validates team creation before calling the API', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TeamsPage />, { auth: { user: USER, isAuthenticated: true } });

    await screen.findByRole('heading', { name: 'CodeCrafters' });
    await user.click(screen.getByRole('button', { name: 'Create a team' }));
    await user.click(screen.getByRole('button', { name: 'Create team' }));

    expect(await screen.findByText('Give the team a name.')).toBeInTheDocument();
    expect(createTeam).not.toHaveBeenCalled();
  });

  it('shows the empty and error states with retry', async () => {
    listTeams.mockResolvedValueOnce([]);
    renderWithProviders(<TeamsPage />, { auth: { user: USER, isAuthenticated: true } });
    expect(await screen.findByText('No teams yet')).toBeInTheDocument();

    listTeams.mockRejectedValueOnce(new Error('Teams are offline'));
    renderWithProviders(<TeamsPage />, { auth: { user: USER, isAuthenticated: true } });
    expect(await screen.findByText('Teams are offline')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload teams' })).toBeInTheDocument();
  });
});
