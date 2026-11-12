import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listHackathons } from '@/services/hackathons';
import LocationProbe from '@/test/locationProbe';
import { renderWithProviders } from '@/test/render';
import HackathonExplorerPage from './HackathonExplorerPage';

vi.mock('@/services/hackathons', () => ({
  listHackathons: vi.fn(),
  getHackathon: vi.fn(),
}));

const OPEN_EVENT = {
  id: 1,
  name: 'AI Sprint',
  domain: 'AI',
  organizer: 'Fusion Labs',
  location: 'Online',
  mode: 'ONLINE',
  description: 'Build an applied AI project.',
  eligibility: 'Students',
  startDate: '2099-01-10',
  endDate: '2099-01-12',
  registrationDeadline: '2099-01-01',
  minTeamSize: 2,
  maxTeamSize: 4,
  registrationUrl: 'https://example.com/register',
};

const CLOSED_EVENT = {
  id: 2,
  name: 'Campus Hack',
  domain: 'Web',
  organizer: 'Campus Club',
  location: 'Pune',
  mode: 'OFFLINE',
  description: 'A past campus event.',
  eligibility: null,
  startDate: '2000-02-01',
  endDate: '2000-02-02',
  registrationDeadline: '2000-01-01',
  minTeamSize: 1,
  maxTeamSize: 3,
  registrationUrl: null,
};

function renderExplorer(entries = ['/hackathons']) {
  return renderWithProviders(
    <Routes>
      <Route
        path="/hackathons"
        element={
          <>
            <HackathonExplorerPage />
            <LocationProbe />
          </>
        }
      />
    </Routes>,
    { initialEntries: entries },
  );
}

describe('HackathonExplorerPage', () => {
  beforeEach(() => {
    listHackathons.mockReset();
  });

  it('renders the real events with the exact status labels', async () => {
    listHackathons.mockResolvedValue([OPEN_EVENT, CLOSED_EVENT]);

    renderExplorer();

    expect(await screen.findByText('AI Sprint')).toBeInTheDocument();
    expect(screen.getByText('Campus Hack')).toBeInTheDocument();
    expect(screen.getAllByText('Registration open').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Registration closed').length).toBeGreaterThan(0);
    expect(screen.getByText('2–4 members')).toBeInTheDocument();
    expect(screen.getAllByText('Completed').length).toBeGreaterThan(0);
    expect(listHackathons).toHaveBeenCalledWith({
      name: '',
      mode: '',
      domain: '',
      location: '',
    });
  });

  it('applies search and mode filters to the URL and the API request', async () => {
    const user = userEvent.setup();
    listHackathons.mockResolvedValue([OPEN_EVENT]);

    renderExplorer();

    await screen.findByText('AI Sprint');
    await user.type(screen.getByLabelText('Search events'), 'AI');
    await user.selectOptions(screen.getByLabelText('Mode'), 'ONLINE');
    await user.click(screen.getByRole('button', { name: 'Apply filters' }));

    await waitFor(() =>
      expect(listHackathons).toHaveBeenLastCalledWith({
        name: 'AI',
        mode: 'ONLINE',
        domain: '',
        location: '',
      }),
    );
    const probe = screen.getByTestId('location-probe');
    expect(probe).toHaveTextContent('q=AI');
    expect(probe).toHaveTextContent('mode=ONLINE');
  });

  it('filters registration and event status in the browser using the published dates', async () => {
    const user = userEvent.setup();
    listHackathons.mockResolvedValue([OPEN_EVENT, CLOSED_EVENT]);

    renderExplorer();

    await screen.findByText('AI Sprint');
    await user.selectOptions(screen.getByLabelText('Registration'), 'closed');
    await user.click(screen.getByRole('button', { name: 'Apply filters' }));

    await waitFor(() => expect(screen.queryByText('AI Sprint')).not.toBeInTheDocument());
    expect(screen.getByText('Campus Hack')).toBeInTheDocument();
    expect(screen.getByTestId('location-probe')).toHaveTextContent('reg=closed');
  });

  it('states the truth when no events exist or no filters match', async () => {
    listHackathons.mockResolvedValue([]);
    renderExplorer();
    expect(await screen.findByText('No hackathons have been added yet')).toBeInTheDocument();

    listHackathons.mockResolvedValue([]);
    renderExplorer(['/hackathons?q=zzz']);

    expect(await screen.findByText('No events match these filters')).toBeInTheDocument();
  });
});
