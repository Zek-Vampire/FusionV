import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { listTeams } from '@/services/teams';
import { getMessageHistory, sendMessage } from '@/services/messages';
import MessagesPage, { MESSAGE_POLL_MS } from './MessagesPage';

vi.mock('@/services/teams', () => ({ listTeams: vi.fn() }));
vi.mock('@/services/messages', () => ({
  getMessageHistory: vi.fn(),
  sendMessage: vi.fn(),
}));

const USER = { id: 1, fullName: 'Aarav Shah' };
const TEAM = {
  id: 4,
  name: 'CodeCrafters',
  hackathonName: 'Campus Hack',
  memberCount: 3,
  maxMembers: 5,
};

beforeEach(() => {
  vi.clearAllMocks();
  listTeams.mockResolvedValue([TEAM]);
  getMessageHistory.mockResolvedValue([
    {
      id: 1,
      teamId: 4,
      senderId: 2,
      senderName: 'Priya Nair',
      content: 'Ready for the demo?',
      createdAt: '2026-11-10T09:00:00',
    },
    {
      id: 2,
      teamId: 4,
      senderId: 1,
      senderName: 'Aarav Shah',
      content: 'Yes, pushing the final build.',
      createdAt: '2026-11-10T09:02:00',
    },
  ]);
  sendMessage.mockResolvedValue({ id: 3 });
});

describe('MessagesPage', () => {
  it('keeps the documented 8-second polling interval', () => {
    expect(MESSAGE_POLL_MS).toBe(8000);
  });

  it('renders the selected team history and sends a message', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MessagesPage />, {
      initialEntries: ['/messages?team=4'],
      auth: { user: USER, isAuthenticated: true },
    });

    expect(await screen.findByText('Ready for the demo?')).toBeInTheDocument();
    expect(screen.getByText('Yes, pushing the final build.')).toBeInTheDocument();
    expect(getMessageHistory).toHaveBeenCalledWith(4);

    await user.type(screen.getByLabelText('Message'), 'On my way');
    await user.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => expect(sendMessage).toHaveBeenCalledWith(4, 'On my way'));
  });

  it('shows an empty team state without calling the message API', async () => {
    listTeams.mockResolvedValue([]);
    renderWithProviders(<MessagesPage />, { auth: { user: USER, isAuthenticated: true } });

    expect(await screen.findByText('You are not in a team yet')).toBeInTheDocument();
    expect(getMessageHistory).not.toHaveBeenCalled();
  });

  it('shows a conversation error with retry', async () => {
    getMessageHistory.mockRejectedValue(new Error('Chat unavailable'));
    renderWithProviders(<MessagesPage />, {
      initialEntries: ['/messages?team=4'],
      auth: { user: USER, isAuthenticated: true },
    });

    expect(await screen.findByText('Chat unavailable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
