import { apiClient } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';

/** GET /notifications — latest 30, newest first. */
export function listNotifications() {
  return apiClient.get(endpoints.notifications.list);
}

/** GET /notifications/unread-count */
export function getUnreadCount() {
  return apiClient.get(endpoints.notifications.unreadCount);
}

/** POST /notifications/{id}/read */
export function markNotificationRead(id) {
  return apiClient.post(endpoints.notifications.read(id));
}

/** POST /notifications/read-all */
export function markAllNotificationsRead() {
  return apiClient.post(endpoints.notifications.readAll);
}
