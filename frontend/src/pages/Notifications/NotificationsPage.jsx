import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import PageHeader from '@/components/public/PageHeader';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { useToast } from '@/context/ToastContext';
import { useNotificationsData } from '@/hooks/useNotificationsData';
import { usePageTitle } from '@/hooks/usePageTitle';
import { formatDateTime, relativeTime } from '@/lib/format';
import { notificationDestination, notificationMeta } from '@/lib/notifications';
import { queryKeys } from '@/lib/queryKeys';
import {
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/notifications';

export default function NotificationsPage() {
  usePageTitle('Notifications');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [filter, setFilter] = useState('all');
  const { list, unread, unreadCount } = useNotificationsData();
  const notifications = list.data || [];
  const visible =
    filter === 'unread' ? notifications.filter((item) => !item.read) : notifications;

  function refresh() {
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
  }

  const markOne = useMutation({
    mutationFn: (id) => markNotificationRead(id),
    onSuccess: (updated, id, context) => {
      refresh();
      if (context?.destination) navigate(context.destination);
      else if (updated) toast({ title: 'Marked as read', variant: 'success' });
    },
    onError: (error) => toast({ title: 'Could not mark it as read', description: error?.message, variant: 'error' }),
  });

  const markAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      refresh();
      toast({ title: 'All notifications marked as read', variant: 'success' });
    },
    onError: (error) => toast({ title: 'Could not mark all as read', description: error?.message, variant: 'error' }),
  });

  function open(notification) {
    const destination = notificationDestination(notification);
    if (notification.read) {
      if (destination) navigate(destination);
      return;
    }
    markOne.mutate(notification.id, { onSuccess: () => {
      refresh();
      if (destination) navigate(destination);
    } });
  }

  return (
    <div>
      <PageHeader
        eyebrow="Your updates"
        title="Notifications"
        description="Invitations, join requests and team messages. Unread counts come from the backend, not a browser guess."
        actions={
          unreadCount > 0 ? (
            <Button
              variant="outline"
              icon={CheckCheck}
              loading={markAll.isPending}
              onClick={() => markAll.mutate()}
            >
              Mark all as read
            </Button>
          ) : null
        }
      />

      <div className="mt-6 flex flex-col gap-3 rounded-panel border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1.5" role="group" aria-label="Filter notifications">
          <button
            type="button"
            aria-pressed={filter === 'all'}
            onClick={() => setFilter('all')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              filter === 'all' ? 'bg-lime text-background' : 'border border-line text-muted hover:text-ink'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            type="button"
            aria-pressed={filter === 'unread'}
            onClick={() => setFilter('unread')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              filter === 'unread' ? 'bg-lime text-background' : 'border border-line text-muted hover:text-ink'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>
        <p className="text-xs text-muted" role="status" aria-live="polite">
          {unreadCount
            ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
            : notifications.length
              ? 'All notifications are read.'
              : ''}
          {unread.isError ? ' · Unread count unavailable' : ''}
        </p>
      </div>

      <div className="mt-4">
        {list.isPending ? (
          <div className="space-y-3" role="status" aria-label="Loading notifications">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="flex gap-3 rounded-panel border border-line bg-surface p-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3.5 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : list.isError ? (
          <ErrorState
            title="Notifications could not be loaded"
            message={list.error?.message}
            onRetry={() => list.refetch()}
            retryLabel="Reload notifications"
          />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={filter === 'unread' ? 'No unread notifications' : 'You are all caught up'}
            description={
              filter === 'unread'
                ? 'Every notification has been read.'
                : 'Join requests, invitations and team messages will appear here.'
            }
            action={
              filter === 'unread' ? (
                <Button variant="outline" onClick={() => setFilter('all')}>
                  View all notifications
                </Button>
              ) : (
                <Link to="/teams" className="text-sm font-semibold text-lime hover:underline">
                  Explore teams
                </Link>
              )
            }
          />
        ) : (
          <ul className="space-y-2.5">
            {visible.map((notification) => {
              const meta = notificationMeta(notification.type);
              const Icon = meta.icon;
              const destination = notificationDestination(notification);
              return (
                <li
                  key={notification.id}
                  className={`flex flex-col gap-3 rounded-panel border p-4 sm:flex-row sm:items-center ${
                    notification.read
                      ? 'border-line bg-surface/70'
                      : 'border-lime/25 bg-lime/[0.04]'
                  }`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-elevated text-lime">
                    <Icon size={16} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant={meta.tone}>{meta.label}</Badge>
                      {!notification.read ? <Badge variant="warning">Unread</Badge> : null}
                    </div>
                    <p className={`mt-1.5 text-sm ${notification.read ? 'text-silver' : 'text-ink'}`}>
                      {notification.message}
                    </p>
                    <p
                      className="mt-0.5 text-[11px] text-muted"
                      title={formatDateTime(notification.createdAt)}
                    >
                      {relativeTime(notification.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {destination ? (
                      <Button
                        size="sm"
                        variant="subtle"
                        onClick={() => open(notification)}
                        loading={markOne.isPending && markOne.variables === notification.id}
                      >
                        Open
                      </Button>
                    ) : null}
                    {!notification.read ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markOne.mutate(notification.id)}
                        disabled={markOne.isPending}
                      >
                        Mark read
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="mt-5 text-xs text-muted">
        This page refreshes every 60 seconds while the tab is visible, and pauses while it is hidden.
      </p>
    </div>
  );
}
