import { test, expect } from '@playwright/test';
import { loginViaUi, state } from './support/helpers';

async function expectNoHorizontalOverflow(page, route) {
  const { overflow, offenders } = await page.evaluate(() => {
    const width = window.innerWidth;
    const nodes = [...document.querySelectorAll('body *')]
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          className: String(element.className || '').slice(0, 120),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        };
      })
      .filter((item) => item.right > width + 1 || item.left < -1)
      .slice(0, 12);
    return { overflow: document.documentElement.scrollWidth - width, offenders: nodes };
  });
  expect(overflow, `${route} overflow; offenders: ${JSON.stringify(offenders)}`).toBeLessThanOrEqual(1);
}

test('login, navigation, dialogs, tabs, downloads and responsive layout', async ({ page }) => {
  await loginViaUi(page, state.member);

  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible();
    await expectNoHorizontalOverflow(page, `/dashboard@${viewport.width}`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Open navigation' }).click();
  const mobileNav = page.getByRole('dialog', { name: 'Workspace navigation' });
  await expect(mobileNav).toBeVisible();
  await mobileNav.getByRole('button', { name: 'Close navigation' }).click();
  await expect(mobileNav).toBeHidden();

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/teams');
  const createTeam = page.getByRole('button', { name: 'Create a team' });
  // WebKit does not focus buttons on pointer click; use the keyboard path to
  // verify that Escape restores focus to the control that opened the dialog.
  await createTeam.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Create a team' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Create a team' })).toBeHidden();
  await expect(createTeam).toBeFocused();

  await page.goto('/community');
  await page.getByRole('button', { name: 'Create post' }).click();
  await expect(page.getByRole('dialog', { name: 'Create a post' })).toBeVisible();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await expect(page.getByRole('dialog', { name: 'Create a post' })).toBeHidden();

  await page.goto('/profile');
  await page.getByRole('tab', { name: 'My posts' }).click();
  await expect(page.getByRole('tab', { name: 'My posts' })).toHaveAttribute(
    'aria-selected',
    'true',
  );

  await page.goto(`/resources/${state.resource.id}`);
  await expect(page.getByRole('heading', { name: state.resource.title })).toBeVisible();
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 15_000 }),
    page
      .getByRole('button', { name: `Download ${state.resource.title}` })
      .click(),
  ]);
  expect(download.suggestedFilename()).toBe(state.resource.filename);
});
