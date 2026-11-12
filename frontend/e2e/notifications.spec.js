import { test, expect } from '@playwright/test';
import {
  api,
  loginViaUi,
  markAllNotificationsRead,
  state,
  unique,
} from './support/helpers';

function unreadFromButton(text) {
  return Number(String(text || '').match(/\((\d+)\)/)?.[1] || 0);
}

test('notifications fetch, mark one and mark all read against the live API', async ({ page }) => {
  await markAllNotificationsRead(state.member);

  await loginViaUi(page, state.member);
  await page.goto('/notifications');
  await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible();

  const first = await api(`/teams/${state.team.id}/messages`, {
    method: 'POST',
    token: state.owner.token,
    body: { content: unique('E2E notification one') },
  });
  expect(first.status).toBe(201);

  await page.reload();
  const unreadButton = page.getByRole('button', { name: /Unread \(/ });
  await unreadButton.waitFor();
  expect(unreadFromButton(await unreadButton.textContent())).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Mark read' }).first().click();
  await expect(page.getByRole('button', { name: /Unread \(0\)/ })).toBeVisible();

  const second = await api(`/teams/${state.team.id}/messages`, {
    method: 'POST',
    token: state.owner.token,
    body: { content: unique('E2E notification two') },
  });
  const third = await api(`/teams/${state.team.id}/messages`, {
    method: 'POST',
    token: state.owner.token,
    body: { content: unique('E2E notification three') },
  });
  expect(second.status).toBe(201);
  expect(third.status).toBe(201);

  await page.reload();
  await page.getByRole('button', { name: 'Mark all as read' }).waitFor();
  await page.getByRole('button', { name: 'Mark all as read' }).click();
  await expect(page.getByRole('button', { name: /Unread \(0\)/ })).toBeVisible();
});
