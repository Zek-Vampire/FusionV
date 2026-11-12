import { test, expect } from '@playwright/test';
import { api, loginViaUi, state, unique } from './support/helpers';

test('profile fields, skills and interests update against the live API', async ({ page }) => {
  const about = unique('E2E profile about');
  const skill = `E2E Skill ${state.runId}`;
  const interest = `E2E Interest ${state.runId}`;

  await loginViaUi(page, state.member);
  try {
    await page.goto('/profile');
    await page.getByRole('button', { name: 'Edit profile' }).click();
    const dialog = page.getByRole('dialog', { name: 'Edit profile' });
    await dialog.getByLabel('Year / branch').fill('E2E Year · Testing');
    await dialog.getByLabel('College').fill('E2E Test College');
    await dialog.getByLabel('Motto').fill('Tested against the live API.');
    await dialog.getByLabel('About me').fill(about);
    await dialog.getByLabel('Location').fill('E2E Lab');
    await dialog.getByLabel('Website or profile link').fill('https://example.com/e2e');
    await dialog.getByRole('button', { name: 'Save profile' }).click();
    await expect(dialog).toBeHidden({ timeout: 20_000 });
    await expect(page.getByText(about)).toBeVisible();

    const skills = page.locator('section').filter({
      has: page.getByRole('heading', { name: 'Skills' }),
    });
    await skills.getByRole('button', { name: 'Add' }).click();
    const skillDialog = page.getByRole('dialog', { name: 'Add skill' });
    await skillDialog.getByLabel('Skill name').fill(skill);
    await skillDialog.getByRole('button', { name: 'Add skill' }).click();
    await expect(page.getByText(skill)).toBeVisible();

    const interests = page.locator('section').filter({
      has: page.getByRole('heading', { name: 'Interests' }),
    });
    await interests.getByRole('button', { name: 'Add' }).click();
    const interestDialog = page.getByRole('dialog', { name: 'Add interest' });
    await interestDialog.getByLabel('Interest name').fill(interest);
    await interestDialog.getByRole('button', { name: 'Add interest' }).click();
    await expect(page.getByText(interest)).toBeVisible();
  } finally {
    await api('/users/me', {
      method: 'PUT',
      token: state.member.token,
      body: {
        fullName: state.member.fullName,
        yearBranch: '',
        college: '',
        motto: '',
        about: '',
        location: '',
        linkUrl: '',
      },
    });
    await api('/users/me/skills', {
      method: 'PUT',
      token: state.member.token,
      body: { values: [] },
    });
    await api('/users/me/interests', {
      method: 'PUT',
      token: state.member.token,
      body: { values: [] },
    });
  }
});
