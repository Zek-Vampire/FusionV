import { useQuery } from '@tanstack/react-query';
import { getUnreadCount, listNotifications } from '@/services/notifications';
import { queryKeys } from '@/lib/queryKeys';

export const NOTIFICATION_POLL_MS = 60_000;

/**
 * Both queries share one cache and stop polling while the browser tab is hidden.
 * React Query's default `refetchIntervalInBackground: false` already covers this,
 * but the explicit predicate also makes the contract obvious.
 */
export function useNotificationsData({ enabled = true } = {}) {
  const list = useQuery({
    queryKey: queryKeys.notifications.list,
    queryFn: listNotifications,
    enabled,
    refetchInterval: () => (document.hidden ? false : NOTIFICATION_POLL_MS),
  });

  const unread = useQuery({
    queryKey: queryKeys.notifications.unread,
    queryFn: getUnreadCount,
    enabled,
    refetchInterval: () => (document.hidden ? false : NOTIFICATION_POLL_MS),
  });

  return {
    list,
    unread,
    unreadCount: Number(unread.data?.count) || 0,
  };
}
