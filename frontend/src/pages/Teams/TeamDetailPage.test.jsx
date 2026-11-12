import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import {
  cancelJoinRequest,
  decideJoinRequest,
  deleteTeam,
  getTeam,
  inviteToTeam,
  leaveTeam,
  listJoinRequests,
  listMyInvitations,
  requestToJoin,
  respondToInvitation,
  updateTeam,
} from '@/services/teams';
import { listHackathons } from '@/services/hackathons';
import TeamDetailPage from './TeamDetailPage';

vi.mock('@/services/teams', () => ({
  getTeam: vi.fn(),
  listMyInvitations: vi.fn(),
  listJoinRequests: vi.fn(),
  decideJoinRequest: vi.fn(),
  inviteToTeam: vi.fn(),
  requestToJoin: vi.fn(),
  cancelJoinRequest: vi.fn(),
  respondToInvitation: vi.fn(),
  deleteTeam: vi.fn(),
  leaveTeam: vi.fn(),
  updateTeam: vi.fn(),
}));
vi.mock('@/services/hackathons', () => ({ listHackathons: vi.fn() }));

const USER = { id: 1, fullName: 'Aarav Shah' };
const TEAM = {
  id: 4,
  name: 'CodeCrafters',
  description: 'Building a campus app.',
  hackathonId: 2,
  hackathonName: 'Campus Hack',
  leaderId: 1,
  leaderName: 'Aarav Shah',
  maxMembers: 5,
  memberCount: 2,
  skills: ['Java', 'SQL'],
  members: [
    { userId: 1, fullName: 'Aarav Shah', role: 'LEADER', joinedAt: '2026-10-01' },
    { userId: 2, fullName: 'Priya Nair', role: 'MEMBER', joinedAt: '2026-10-02' },
  ],
  myStatus: 'LEADER',
  createdAt: '2026-10-01T10:00:00',
};

function renderTeam() {
  return renderWithProviders(
    <Routes>
      <Route path="/teams/:teamId" element={<TeamDetailPage />} />
    </Routes>,
    { initialEntries: ['/teams/4'], auth: { user: USER, isAuthenticated: true } },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  getTeam.mockResolvedValue(TEAM);
  listMyInvitations.mockResolvedValue([]);
  listJoinRequests.mockResolvedValue([
    { id: 21, teamId: 4, userId: 7, userName: 'Neel Joshi', createdAt: '2026-11-10T09:00:00' },
  ]);
  decideJoinRequest.mockResolvedValue({ id: 21 });
  inviteToTeam.mockResolvedValue({ id: 22 });
  requestToJoin.mockResolvedValue({});
  cancelJoinRequest.mockResolvedValue(null);
  respondToInvitation.mockResolvedValue({});
  deleteTeam.mockResolvedValue(null);
  leaveTeam.mockResolvedValue(null);
  updateTeam.mockResolvedValue(TEAM);
  listHackathons.mockResolvedValue([{ id: 2, name: 'Campus Hack', maxTeamSize: 5 }]);
});

describe('TeamDetailPage', () => {
  it('renders team members and leader tools from real queries', async () => {
    renderTeam();

    expect(await screen.findByRole('heading', { name: 'CodeCrafters' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Priya Nair' })).toBeInTheDocument();
    expect((await screen.findAllByText('Neel Joshi')).length).toBeGreaterThan(0);
    expect(screen.getByText('Leader tools')).toBeInTheDocument();
    expect(screen.getByText('2/5 members')).toBeInTheDocument();
  });

  it('accepts a pending join request', async () => {
    const user = userEvent.setup();
    renderTeam();

    const row = (await screen.findAllByText('Neel Joshi'))[0].closest('li');
    await user.click(within(row).getByRole('button', { name: 'Accept' }));

    await waitFor(() => expect(decideJoinRequest).toHaveBeenCalledWith(21, true));
    expect(await screen.findByText('Member added to the team')).toBeInTheDocument();
  });

  it('validates an invitation email and then sends it', async () => {
    const user = userEvent.setup();
    renderTeam();

    const input = await screen.findByLabelText('Student email');
    await user.click(screen.getByRole('button', { name: 'Send invitation' }));
    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
    expect(inviteToTeam).not.toHaveBeenCalled();

    await user.type(input, 'priya@college.edu');
    await user.click(screen.getByRole('button', { name: 'Send invitation' }));
    await waitFor(() => expect(inviteToTeam).toHaveBeenCalledWith('4', 'priya@college.edu'));
    expect(await screen.findByText('Invitation sent to priya@college.edu.')).toBeInTheDocument();
  });

  it('shows a not-found state for a missing team', async () => {
    const error = new Error('Team not found');
    error.status = 404;
    getTeam.mockRejectedValue(error);
    renderTeam();

    expect(await screen.findByText('Team not found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to teams' })).toHaveAttribute('href', '/teams');
  });
});
