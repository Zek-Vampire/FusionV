import fs from 'node:fs';
import { test, expect } from '@playwright/test';
import {
  api,
  deleteResource,
  loginViaUi,
  state,
  unique,
  uploadResourceFile,
} from './support/helpers';

test('resource upload, edit, download filename and delete', async ({ page }) => {
  const title = unique('E2E Resource');
  const editedTitle = `${title} edited`;
  let resourceId = null;

  await loginViaUi(page, state.member);
  try {
    const { filename } = await uploadResourceFile(page, { title });
    await expect(page.getByRole('link', { name: title })).toBeVisible();

    const mine = await api('/resources/mine', { token: state.member.token });
    const resource = (mine.data || []).find((item) => item.title === title);
    expect(resource, 'uploaded resource was not returned by the live API').toBeTruthy();
    resourceId = resource.id;

    const item = page.locator('li').filter({ hasText: title }).first();
    await item.getByRole('button', { name: 'Edit' }).click();
    const editDialog = page.getByRole('dialog', { name: 'Edit resource' });
    await editDialog.getByLabel('Title').fill(editedTitle);
    await editDialog.getByLabel('Subject').fill('E2E Edited');
    await editDialog.getByRole('button', { name: 'Save changes' }).click();
    await expect(editDialog).toBeHidden({ timeout: 20_000 });
    await expect(page.getByRole('link', { name: editedTitle })).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15_000 }),
      page.getByRole('button', { name: `Download ${editedTitle}` }).click(),
    ]);
    expect(download.suggestedFilename()).toBe(filename);
    const path = await download.path();
    expect(fs.readFileSync(path, 'utf8')).toContain(filename);

    const editedItem = page.locator('li').filter({ hasText: editedTitle }).first();
    await editedItem.getByRole('button', { name: 'Delete' }).click();
    const confirm = page.getByRole('dialog', { name: 'Delete resource' });
    await expect(confirm).toBeVisible();
    await confirm.getByRole('button', { name: 'Delete resource' }).click();
    await expect(confirm).toBeHidden({ timeout: 15_000 });
    await expect(page.getByRole('link', { name: editedTitle })).toBeHidden();
    resourceId = null;
  } finally {
    if (resourceId) await deleteResource(resourceId);
  }
});
