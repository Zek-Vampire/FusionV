import { test, expect } from '@playwright/test';
import {
  api,
  deleteTeam,
  loginViaUi,
  state,
  unique,
} from './support/helpers';
import { teamCard } from './support/selectors';

test.describe('teams', () => {
  test('create a team through the UI, join it, leave it, and accept an invitation', async ({
    browser,
  }) => {
    const ownerContext = await browser.newContext();
    const memberContext = await browser.newContext();
    const ownerPage = await ownerContext.newPage();
    const memberPage = await memberContext.newPage();
    const teamName = unique('E2E Team');
    let teamId = null;

    try {
      await loginViaUi(ownerPage, state.owner);
      await ownerPage.goto('/teams');
      await ownerPage.getByRole('button', { name: 'Create a team' }).click();
      const createDialog = ownerPage.getByRole('dialog', { name: 'Create a team' });
      await createDialog.getByRole('button', { name: 'Create team' }).click();
      await expect(createDialog.getByText('Give the team a name.')).toBeVisible();

      await createDialog.getByLabel('Team name').fill(teamName);
      await createDialog
        .getByLabel(/What is the team working on/)
        .fill('Live browser team for the permanent E2E suite.');
      await createDialog.getByLabel('Required skills').fill('Testing, Java');
      await createDialog.getByRole('button', { name: 'Create team' }).click();
      await expect(createDialog).toBeHidden({ timeout: 20_000 });
      await expect(ownerPage.getByRole('link', { name: teamName })).toBeVisible();

      const found = await api(`/teams?q=${encodeURIComponent(teamName)}`, {
        token: state.owner.token,
      });
      const created = (found.data || []).find((team) => team.name === teamName);
      expect(created, 'created team was not returned by the live API').toBeTruthy();
      teamId = created.id;

      await loginViaUi(memberPage, state.member);
      await memberPage.goto(`/teams/${teamId}`);
      await memberPage.getByRole('button', { name: 'Request to join' }).click();
      await expect(memberPage.getByRole('button', { name: 'Cancel join request' })).toBeVisible();

      await ownerPage.goto(`/teams/${teamId}`);
      const acceptRequest = ownerPage.getByRole('button', { name: 'Accept' });
      await expect(acceptRequest).toBeVisible();
      await acceptRequest.click();
      await expect(ownerPage.getByText('2/5 members')).toBeVisible({ timeout: 10_000 });

      await memberPage.reload();
      await expect(memberPage.getByText('You are a member')).toBeVisible();

      await memberPage.getByRole('button', { name: 'Leave team' }).click();
      const leaveDialog = memberPage.getByRole('dialog', { name: 'Leave team' });
      await expect(leaveDialog).toBeVisible();
      await leaveDialog.getByRole('button', { name: 'Leave team' }).click();
      await memberPage.waitForURL(/\/teams\?tab=mine/);

      await ownerPage.reload();
      await expect(ownerPage.getByText('1/5 members')).toBeVisible();

      await ownerPage.getByLabel('Student email').fill(state.member.email);
      await ownerPage.getByRole('button', { name: 'Send invitation' }).click();
      await expect(
        ownerPage.getByText(`Invitation sent to ${state.member.email}.`),
      ).toBeVisible();

      await memberPage.goto('/teams?tab=invites');
      const invitation = memberPage.locator('li').filter({ hasText: teamName }).first();
      await expect(invitation).toBeVisible();
      await invitation.getByRole('button', { name: 'Accept' }).click();
      await memberPage.goto(`/teams/${teamId}`);
      await expect(memberPage.getByText('You are a member')).toBeVisible();
    } finally {
      if (teamId) await deleteTeam(teamId);
      await ownerContext.close();
      await memberContext.close();
    }
  });

  test('saved teams persist on this device and can be removed', async ({ page }) => {
    await loginViaUi(page, state.member);
    await page.goto('/teams');
    const card = teamCard(page, state.team.name);
    await card.waitFor();
    await card.getByRole('button', { name: 'Save team on this device' }).click();

    const saved = await page.evaluate(
      ({ userId, teamId }) => {
        const raw = window.localStorage.getItem(`fusionv_saved_teams:${userId}`);
        return raw ? JSON.parse(raw).includes(teamId) : false;
      },
      { userId: state.member.id, teamId: state.team.id },
    );
    expect(saved).toBe(true);

    await page.reload();
    await page.getByRole('link', { name: state.team.name }).waitFor();
    await page.getByRole('tab', { name: 'Saved' }).click();
    await expect(page.getByRole('link', { name: state.team.name })).toBeVisible();
    await expect(page.getByText('Saved on this device only').first()).toBeVisible();

    await page.getByRole('button', { name: 'Remove from saved teams' }).click();
    await expect(page.getByText('No saved teams on this device')).toBeVisible();
  });
});
