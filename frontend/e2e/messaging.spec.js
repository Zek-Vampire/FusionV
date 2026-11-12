import { test, expect } from '@playwright/test';
import { api, loginViaUi, state, unique } from './support/helpers';

test('team messaging persists and live polling delivers a teammate message', async ({ page }) => {
  const ownMessage = unique('E2E member message');
  const ownerMessage = unique('E2E owner poll message');

  await loginViaUi(page, state.member);
  await page.goto(`/messages?team=${state.team.id}`);
  await expect(page.getByRole('heading', { name: 'Messages' })).toBeVisible();

  await page.getByLabel('Message').fill(ownMessage);
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByText(ownMessage)).toBeVisible();

  await page.reload();
  await expect(page.getByText(ownMessage)).toBeVisible();

  const sent = await api(`/teams/${state.team.id}/messages`, {
    method: 'POST',
    token: state.owner.token,
    body: { content: ownerMessage },
  });
  expect(sent.status).toBe(201);

  // MESSAGE_POLL_MS is 8 seconds; allow one interval plus network time.
  await expect(page.getByText(ownerMessage)).toBeVisible({ timeout: 15_000 });
});
