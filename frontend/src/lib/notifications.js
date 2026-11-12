import { Bell, CheckCircle2, Mail, MessageSquare, UserPlus, XCircle } from 'lucide-react';
import { paths } from '@/routes/paths';

const META = {
  JOIN_REQUEST: { label: 'Join request', icon: UserPlus, tone: 'warning' },
  REQUEST_ACCEPTED: { label: 'Request accepted', icon: CheckCircle2, tone: 'success' },
  REQUEST_REJECTED: { label: 'Request declined', icon: XCircle, tone: 'neutral' },
  TEAM_INVITE: { label: 'Team invitation', icon: Mail, tone: 'lime' },
  NEW_MESSAGE: { label: 'New message', icon: MessageSquare, tone: 'warning' },
};

export function notificationMeta(type) {
  return META[type] || { label: 'Notification', icon: Bell, tone: 'neutral' };
}

export function notificationDestination(notification) {
  if (!notification?.relatedTeamId) return null;
  if (notification.type === 'NEW_MESSAGE') {
    return `${paths.messages}?team=${encodeURIComponent(notification.relatedTeamId)}`;
  }
  return paths.team(notification.relatedTeamId);
}
