import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { expect } from '@playwright/test';

const STATE_FILE = path.resolve('.e2e/state.json');

export function readState() {
  if (!fs.existsSync(STATE_FILE)) {
    throw new Error('E2E state is missing. Run the suite through Playwright so global setup can prepare it.');
  }
  return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
}

export const state = readState();

export function unique(prefix) {
  return `${prefix} ${state.runId} ${crypto.randomBytes(3).toString('hex')}`;
}

export async function api(
  apiPath,
  { method = 'GET', token, body, headers = {} } = {},
) {
  const requestHeaders = { Accept: '*/*', ...headers };
  if (token) requestHeaders.Authorization = `Bearer ${token}`;
  let payload = body;
  if (body && !(body instanceof FormData)) {
    requestHeaders['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const response = await fetch(`${state.apiURL}${apiPath}`, {
    method,
    headers: requestHeaders,
    body: payload,
  });
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  return { status: response.status, data, text, headers: response.headers };
}

export async function loginViaUi(page, account, { remember = false, next = '/dashboard' } = {}) {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel('Email address').fill(account.email);
  await page.getByLabel('Password', { exact: true }).fill(account.password);

  const checkbox = page.getByLabel('Keep me signed in on this device');
  if ((await checkbox.isChecked()) !== remember) {
    // The native input is intentionally sr-only; a real user clicks the label.
    await page.getByText('Keep me signed in on this device', { exact: true }).click();
  }
  expect(await checkbox.isChecked()).toBe(remember);

  await page.getByRole('button', { name: 'Log in' }).click();
  await page.waitForURL((url) => url.pathname === new URL(next, state.baseURL).pathname);
}

export async function logoutViaUi(page) {
  await page.goto('/settings');
  await page.getByRole('button', { name: 'Log out' }).last().click();
  await page.waitForURL((url) => url.pathname === '/');
}

export async function sessionStorage(page) {
  return page.evaluate(() => ({
    localToken: Boolean(window.localStorage.getItem('fusionv_token')),
    sessionToken: Boolean(window.sessionStorage.getItem('fusionv_token')),
    rememberedEmail: Boolean(window.localStorage.getItem('fusionv_email')),
  }));
}

export async function currentTeam(teamId) {
  return api(`/teams/${teamId}`, { token: state.owner.token });
}

export async function deleteTeam(teamId) {
  return api(`/teams/${teamId}`, { method: 'DELETE', token: state.owner.token });
}

export async function deletePost(postId) {
  return api(`/posts/${postId}`, { method: 'DELETE', token: state.member.token });
}

export async function deleteResource(resourceId) {
  return api(`/resources/${resourceId}`, { method: 'DELETE', token: state.member.token });
}

export async function markAllNotificationsRead(account = state.member) {
  return api('/notifications/read-all', { method: 'POST', token: account.token });
}

export async function unreadCount(account = state.member) {
  const response = await api('/notifications/unread-count', { token: account.token });
  return Number(response.data?.count) || 0;
}

export async function uploadResourceFile(page, { title, subject = 'E2E', tags = 'e2e' } = {}) {
  const filename = `e2e-${state.runId}-${crypto.randomBytes(3).toString('hex')}.txt`;
  const filePath = testOutputFile(filename);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `FusionV E2E resource ${filename}\n`);
  await page.goto('/resources/mine');
  await page.getByRole('button', { name: 'Upload resource' }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Upload a resource' });
  await dialog.locator('input[type="file"]').setInputFiles(filePath);
  await dialog.getByLabel('Title').fill(title);
  await dialog.getByLabel('Subject').fill(subject);
  await dialog.getByLabel('Tags').fill(tags);
  await dialog.getByRole('button', { name: 'Upload resource' }).click();
  await expect(dialog).toBeHidden({ timeout: 20_000 });
  return { filename, filePath };
}

function testOutputFile(filename) {
  return path.resolve('test-results', 'files', filename);
}
