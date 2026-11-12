import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { listPosts } from '@/services/posts';
import { listMyResources } from '@/services/resources';
import { listTeams } from '@/services/teams';
import {
  downloadResume,
  getMyStats,
  replaceInterests,
  replaceSkills,
  updateMyProfile,
  uploadResume,
} from '@/services/users';
import ProfilePage from './ProfilePage';

vi.mock('@/services/posts', () => ({ listPosts: vi.fn() }));
vi.mock('@/services/resources', () => ({ listMyResources: vi.fn() }));
vi.mock('@/services/teams', () => ({ listTeams: vi.fn() }));
vi.mock('@/services/users', () => ({
  getMyStats: vi.fn(),
  updateMyProfile: vi.fn(),
  replaceSkills: vi.fn(),
  replaceInterests: vi.fn(),
  uploadResume: vi.fn(),
  downloadResume: vi.fn(),
}));

const USER = {
  id: 1,
  fullName: 'Aarav Shah',
  email: 'aarav@college.edu',
  role: 'STUDENT',
  yearBranch: '3rd year · Computer Engineering',
  college: 'VJTI',
  motto: 'Build useful things.',
  about: 'I build web applications.',
  location: 'Mumbai',
  linkUrl: 'https://example.com/aarav',
  resumeFileName: 'aarav-resume.pdf',
  skills: ['Java', 'SQL'],
  interests: ['Open Source'],
  createdAt: '2026-01-15T10:00:00',
};

beforeEach(() => {
  vi.clearAllMocks();
  getMyStats.mockResolvedValue({ teamsJoined: 2, hackathons: 1, resourcesShared: 1, posts: 2 });
  listTeams.mockResolvedValue([
    { id: 4, name: 'CodeCrafters', hackathonName: 'Campus Hack', memberCount: 2, maxMembers: 5, myStatus: 'LEADER' },
  ]);
  listPosts.mockResolvedValue([
    {
      id: 9,
      authorId: 1,
      authorName: 'Aarav Shah',
      content: 'Built a campus app.',
      type: 'ACHIEVEMENT',
      title: 'Best campus app',
      likeCount: 4,
      commentCount: 1,
      createdAt: '2026-11-01T10:00:00',
    },
  ]);
  listMyResources.mockResolvedValue([
    { id: 3, title: 'DBMS Notes', category: 'NOTES', downloadCount: 12 },
  ]);
  replaceSkills.mockResolvedValue({ ...USER, skills: ['SQL'] });
  replaceInterests.mockResolvedValue(USER);
  updateMyProfile.mockResolvedValue(USER);
  uploadResume.mockResolvedValue({ ...USER, resumeFileName: 'new.pdf' });
  downloadResume.mockResolvedValue({ filename: 'aarav-resume.pdf' });
});

function renderProfile() {
  return renderWithProviders(<ProfilePage />, {
    auth: { user: USER, isAuthenticated: true },
  });
}

describe('ProfilePage', () => {
  it('renders profile details, completion and KPI data', async () => {
    const user = userEvent.setup();
    renderProfile();

    expect(screen.getByRole('heading', { name: 'Aarav Shah' })).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('Your profile is complete.')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'My teams' }));
    expect(await screen.findByText('CodeCrafters')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'My resources' }));
    expect(screen.getByText('DBMS Notes')).toBeInTheDocument();
  });

  it('removes a skill through the replace-skills endpoint', async () => {
    const user = userEvent.setup();
    renderProfile();

    await user.click(screen.getByRole('button', { name: 'Remove skill Java' }));
    await waitFor(() => expect(replaceSkills).toHaveBeenCalledWith(['SQL']));
    expect(await screen.findByText('Skills updated')).toBeInTheDocument();
  });

  it('validates the profile edit form before submitting', async () => {
    const user = userEvent.setup();
    renderProfile();

    await user.click(screen.getByRole('button', { name: 'Edit profile' }));
    const dialog = await screen.findByRole('dialog');
    const name = within(dialog).getByLabelText('Full name');
    await user.clear(name);
    await user.click(within(dialog).getByRole('button', { name: 'Save profile' }));

    expect(await within(dialog).findByText('Enter your full name.')).toBeInTheDocument();
    expect(updateMyProfile).not.toHaveBeenCalled();
  });

  it('shows the achievements tab from real posts', async () => {
    const user = userEvent.setup();
    renderProfile();

    await user.click(screen.getByRole('tab', { name: 'Achievements' }));
    expect(await screen.findByText('Best campus app')).toBeInTheDocument();
    expect(screen.getByText(/self-reported, not verified/i)).toBeInTheDocument();
  });
});
