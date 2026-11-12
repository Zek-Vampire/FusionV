import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import LocationProbe from '@/test/locationProbe';
import { NOTIFICATION_POLL_MS } from '@/hooks/useNotificationsData';
import {
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/notifications';
import NotificationsPage from './NotificationsPage';

vi.mock('@/services/notifications', () => ({
  listNotifications: vi.fn(),
  getUnreadCount: vi.fn(),
  markNotificationRead: vi.fn(),
  markAllNotificationsRead: vi.fn(),
}));

const NOTIFICATION = {
  id: 8,
  type: 'NEW_MESSAGE',
  message: 'New message in CodeCrafters',
  relatedTeamId: 4,
  read: false,
  createdAt: '2026-11-10T09:00:00',
};

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route
        path="/notifications"
        element={
          <>
            <NotificationsPage />
            <LocationProbe />
          </>
        }
      />
      <Route path="/messages" element={<LocationProbe />} />
    </Routes>,
    { initialEntries: ['/notifications'], auth: { isAuthenticated: true } },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  listNotifications.mockResolvedValue([NOTIFICATION]);
  getUnreadCount.mockResolvedValue({ count: 1 });
  markNotificationRead.mockResolvedValue({ ...NOTIFICATION, read: true });
  markAllNotificationsRead.mockResolvedValue(null);
});

describe('NotificationsPage', () => {
  it('keeps the documented 60-second polling interval', () => {
    expect(NOTIFICATION_POLL_MS).toBe(60_000);
  });

  it('marks one notification read and opens its team destination', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText('New message in CodeCrafters')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Open' }));

    await waitFor(() => expect(markNotificationRead).toHaveBeenCalledWith(8));
    expect(screen.getByTestId('location-probe')).toHaveTextContent('/messages?team=4');
  });

  it('marks all notifications as read', async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('New message in CodeCrafters');
    await user.click(screen.getByRole('button', { name: 'Mark all as read' }));

    await waitFor(() => expect(markAllNotificationsRead).toHaveBeenCalled());
    expect(await screen.findByText('All notifications marked as read')).toBeInTheDocument();
  });

  it('shows an empty state when there are no notifications', async () => {
    listNotifications.mockResolvedValue([]);
    getUnreadCount.mockResolvedValue({ count: 0 });
    renderPage();

    expect(await screen.findByText('You are all caught up')).toBeInTheDocument();
  });

  it('shows the API error with a retry action', async () => {
    listNotifications.mockRejectedValue(new Error('Notifications unavailable'));
    renderPage();

    expect(await screen.findByText('Notifications unavailable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload notifications' })).toBeInTheDocument();
  });
});
