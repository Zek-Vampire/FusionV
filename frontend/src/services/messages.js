import { apiClient } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';

/** GET /teams/{teamId}/messages — last 100 messages, oldest first. */
export function getMessageHistory(teamId) {
  return apiClient.get(endpoints.messages.list(teamId));
}

/** POST /teams/{teamId}/messages */
export function sendMessage(teamId, content) {
  return apiClient.post(endpoints.messages.send(teamId), { content });
}
