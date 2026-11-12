import crypto from 'node:crypto';
import { test, expect } from '@playwright/test';
import { loginViaUi, logoutViaUi, sessionStorage, state } from './support/helpers';

test.describe('authentication', () => {
  test('registration creates a real account and session', async ({ page }) => {
    const run = crypto.randomBytes(4).toString('hex');
    const email = `e2e.registration.${state.runId}.${run}@example.com`;
    const password = `E2e${crypto.randomBytes(8).toString('base64url')}9`;

    await page.goto('/signup?next=%2Fdashboard');
    await page.getByLabel('Full name').fill(`E2E Registration ${run}`);
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Create account' }).click();

    await page.waitForURL((url) => url.pathname === '/dashboard');
    await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible();
    expect((await sessionStorage(page)).sessionToken).toBe(true);

    // The backend has no account-deletion endpoint; this disposable account is
    // intentionally documented in the cleanup report.
    test.info().annotations.push({
      type: 'undeletable-test-account',
      description: email,
    });
    console.log(`Undeletable E2E registration account: ${email}`);

    await logoutViaUi(page);
    expect(await sessionStorage(page)).toEqual({
      localToken: false,
      sessionToken: false,
      rememberedEmail: false,
    });
  });

  test('protected route redirects signed-out visitors with a return path', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/\/login\?next=/);
    expect(page.url()).toContain('next=%2Fdashboard');
    expect(await sessionStorage(page)).toEqual({
      localToken: false,
      sessionToken: false,
      rememberedEmail: false,
    });
  });

  test('invalid credentials show an error and do not create a session', async ({ page }) => {
    await page.goto('/login?next=%2Fdashboard');
    await page.getByLabel('Email address').fill(state.owner.email);
    await page.getByLabel('Password', { exact: true }).fill('WrongPassword123');
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
    expect((await sessionStorage(page)).localToken).toBe(false);
    expect((await sessionStorage(page)).sessionToken).toBe(false);
  });

  test('remember-me persists across refresh and a new tab', async ({ page, context }) => {
    await loginViaUi(page, state.owner, { remember: true });
    expect(await sessionStorage(page)).toEqual({
      localToken: true,
      sessionToken: false,
      rememberedEmail: true,
    });

    await page.reload();
    await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible();

    const other = await context.newPage();
    await other.goto('/dashboard');
    await expect(other.getByRole('heading', { name: /Welcome back/ })).toBeVisible();
    await other.close();
  });

  test('remember-me off keeps the session tab-only', async ({ page, context }) => {
    await loginViaUi(page, state.member, { remember: false });
    expect(await sessionStorage(page)).toEqual({
      localToken: false,
      sessionToken: true,
      rememberedEmail: false,
    });

    await page.reload();
    await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible();

    const other = await context.newPage();
    await other.goto('/dashboard');
    await other.waitForURL(/\/login\?next=/);
    await other.close();
  });

  test('logout clears storage and returns to the public home', async ({ page }) => {
    await loginViaUi(page, state.member, { remember: true });
    await logoutViaUi(page);

    expect(page.url()).toBe(`${state.baseURL}/`);
    expect(await sessionStorage(page)).toEqual({
      localToken: false,
      sessionToken: false,
      rememberedEmail: false,
    });
  });
});
