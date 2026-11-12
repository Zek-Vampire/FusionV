import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { getPublicStats } from '@/services/public';
import { renderWithProviders } from '@/test/render';
import HomePage from './HomePage';

vi.mock('@/services/public', () => ({
  getPublicStats: vi.fn(),
}));

const STATS = { students: 128, teams: 46, hackathons: 17, resources: 93, posts: 210 };

describe('HomePage', () => {
  beforeEach(() => {
    getPublicStats.mockReset();
  });

  it('renders the landing hero and the real aggregate stats', async () => {
    getPublicStats.mockResolvedValue(STATS);

    renderWithProviders(<HomePage />);

    expect(screen.getByRole('heading', { name: /Build teams/i })).toBeInTheDocument();
    expect(await screen.findByText('128')).toBeInTheDocument();
    expect(screen.getByText('17')).toBeInTheDocument();
    expect(screen.getByText('93')).toBeInTheDocument();
    expect(screen.getByText('210')).toBeInTheDocument();
    expect(getPublicStats).toHaveBeenCalledTimes(1);
  });

  it('shows the API failure and retries with a real request', async () => {
    const user = userEvent.setup();
    getPublicStats
      .mockRejectedValueOnce(new Error('Cannot reach the FusionV server.'))
      .mockResolvedValueOnce(STATS);

    renderWithProviders(<HomePage />);

    expect(await screen.findByText('Community totals are unavailable right now')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reload totals' }));

    await waitFor(() => expect(getPublicStats).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('128')).toBeInTheDocument();
  });
});
