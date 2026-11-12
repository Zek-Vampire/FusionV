import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listHackathons } from '@/services/hackathons';
import { listResources } from '@/services/resources';
import { searchTeams } from '@/services/teams';
import { searchStudents } from '@/services/users';
import LocationProbe from '@/test/locationProbe';
import { renderWithProviders } from '@/test/render';
import SearchPage from './SearchPage';

vi.mock('@/services/hackathons', () => ({ listHackathons: vi.fn() }));
vi.mock('@/services/resources', () => ({ listResources: vi.fn() }));
vi.mock('@/services/teams', () => ({ searchTeams: vi.fn() }));
vi.mock('@/services/users', () => ({ searchStudents: vi.fn() }));

const HACKATHONS = [
  {
    id: 1,
    name: 'AI Sprint',
    organizer: 'Fusion Labs',
    domain: 'AI',
    location: 'Online',
    mode: 'ONLINE',
    description: 'An AI build event',
    eligibility: 'Students',
    startDate: '2099-01-10',
    endDate: '2099-01-12',
    registrationDeadline: '2099-01-01',
  },
  {
    id: 2,
    name: 'Campus Web',
    organizer: 'Web Club',
    domain: 'Web',
    location: 'Pune',
    mode: 'OFFLINE',
    description: 'A web event',
    startDate: '2099-02-01',
    endDate: '2099-02-02',
    registrationDeadline: '2099-01-15',
  },
];

const RESOURCE = {
  id: 5,
  title: 'AI Notes',
  description: 'Neural networks',
  subject: 'AI',
  category: 'NOTES',
  tags: 'ai',
  sizeBytes: 1024,
  downloadCount: 4,
  uploaderName: 'Priya Nair',
  createdAt: '2026-10-01T10:00:00',
};

function renderSearch(entries = ['/search?q=ai']) {
  return renderWithProviders(
    <Routes>
      <Route
        path="/search"
        element={
          <>
            <SearchPage />
            <LocationProbe />
          </>
        }
      />
    </Routes>,
    { initialEntries: entries },
  );
}

describe('SearchPage', () => {
  beforeEach(() => {
    listHackathons.mockReset().mockResolvedValue([]);
    listResources.mockReset().mockResolvedValue([]);
    searchTeams.mockReset().mockResolvedValue([]);
    searchStudents.mockReset().mockResolvedValue([]);
  });

  it('shows public results and locks team/student search for signed-out visitors', async () => {
    listHackathons.mockResolvedValue(HACKATHONS);
    listResources.mockResolvedValue([RESOURCE]);

    renderSearch();

    expect(await screen.findByText('AI Sprint')).toBeInTheDocument();
    expect(screen.queryByText('Campus Web')).not.toBeInTheDocument();
    expect(await screen.findByText('AI Notes')).toBeInTheDocument();
    expect(
      screen.getByText(/Team records are protected by the backend/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Student search is protected by the backend/),
    ).toBeInTheDocument();
    expect(searchTeams).not.toHaveBeenCalled();
    expect(searchStudents).not.toHaveBeenCalled();
  });

  it('searches teams and students for a signed-in user', async () => {
    listHackathons.mockResolvedValue(HACKATHONS);
    listResources.mockResolvedValue([RESOURCE]);
    searchTeams.mockResolvedValue([
      { id: 9, name: 'AI Builders', hackathonName: 'AI Sprint', memberCount: 2, maxMembers: 5 },
    ]);
    searchStudents.mockResolvedValue([
      { id: 3, fullName: 'Priya Nair', yearBranch: 'CSE', college: 'IIT', skills: ['React'] },
    ]);

    renderWithProviders(
      <Routes>
        <Route path="/search" element={<SearchPage />} />
      </Routes>,
      {
        initialEntries: ['/search?q=ai'],
        auth: { isAuthenticated: true, status: 'authenticated' },
      },
    );

    expect(await screen.findByText('AI Builders')).toBeInTheDocument();
    expect((await screen.findAllByText('Priya Nair')).length).toBeGreaterThan(0);
    await waitFor(() => {
      expect(searchTeams).toHaveBeenCalledWith({ q: 'ai' });
      expect(searchStudents).toHaveBeenCalledWith({ q: 'ai' });
    });
    expect(screen.queryByText(/Team records are protected/)).not.toBeInTheDocument();
  });

  it('shows the API error without a zero-result badge for a failed public section', async () => {
    listHackathons.mockRejectedValue(new Error('Request failed (502)'));

    renderSearch();

    await screen.findByText('Request failed (502)');

    const section = screen.getByRole('heading', { name: 'Hackathons' }).closest('section');
    expect(within(section).queryByText('0', { exact: true })).not.toBeInTheDocument();
  });

  it('prompts for a query and updates the URL when a new search is submitted', async () => {
    const user = userEvent.setup();
    renderSearch(['/search']);

    expect(screen.getByText('Search the whole platform')).toBeInTheDocument();
    expect(listHackathons).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText('Search hackathons, resources, teams and students'), 'ml');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() => expect(screen.getByTestId('location-probe')).toHaveTextContent('q=ml'));
  });
});
