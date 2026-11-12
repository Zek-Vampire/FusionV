import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getHackathon } from '@/services/hackathons';
import { renderWithProviders } from '@/test/render';
import HackathonDetailPage from './HackathonDetailPage';

vi.mock('@/services/hackathons', () => ({
  listHackathons: vi.fn(),
  getHackathon: vi.fn(),
}));

const EVENT = {
  id: 7,
  name: 'AI Sprint',
  domain: 'AI',
  organizer: 'Fusion Labs',
  location: 'Online',
  mode: 'ONLINE',
  description: 'Build an applied AI project.',
  eligibility: 'Students only',
  startDate: '2099-01-10',
  endDate: '2099-01-12',
  registrationDeadline: '2099-01-01',
  minTeamSize: 2,
  maxTeamSize: 4,
  registrationUrl: 'https://example.com/register',
};

function renderDetail(entry = '/hackathons/7') {
  return renderWithProviders(
    <Routes>
      <Route path="/hackathons/:hackathonId" element={<HackathonDetailPage />} />
    </Routes>,
    { initialEntries: [entry] },
  );
}

describe('HackathonDetailPage', () => {
  beforeEach(() => {
    getHackathon.mockReset();
  });

  it('renders details, the registration link and the create-team gate', async () => {
    getHackathon.mockResolvedValue(EVENT);

    renderDetail();

    expect(await screen.findByRole('heading', { name: 'AI Sprint' })).toBeInTheDocument();
    expect(screen.getByText('Build an applied AI project.')).toBeInTheDocument();
    expect(screen.getByText('Students only')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Register on organizer site/ })).toHaveAttribute(
      'href',
      'https://example.com/register',
    );
    expect(screen.getByRole('link', { name: /Log in to create a team/ })).toHaveAttribute(
      'href',
      `/login?next=${encodeURIComponent('/hackathons/7')}`,
    );
    expect(getHackathon).toHaveBeenCalledWith('7');
  });

  it('does not offer registration after the deadline', async () => {
    getHackathon.mockResolvedValue({
      ...EVENT,
      registrationDeadline: '2000-01-01',
      startDate: '2000-02-01',
      endDate: '2000-02-02',
    });

    renderDetail();

    expect(await screen.findByRole('heading', { name: 'AI Sprint' })).toBeInTheDocument();
    expect(screen.getAllByText('Registration closed').length).toBeGreaterThan(0);
    expect(screen.queryByRole('link', { name: /Register on organizer site/ })).not.toBeInTheDocument();
  });

  it('shows a not-found state for a missing hackathon', async () => {
    getHackathon.mockRejectedValue({ status: 404, message: 'Hackathon 404 was not found' });

    renderDetail('/hackathons/404');

    expect(await screen.findByText('Hackathon not found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to hackathons' })).toBeInTheDocument();
  });
});
