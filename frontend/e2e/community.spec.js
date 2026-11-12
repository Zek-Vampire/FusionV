import { test, expect } from '@playwright/test';
import {
  api,
  deletePost,
  loginViaUi,
  state,
  unique,
} from './support/helpers';
import { articleWithText } from './support/selectors';

test('community post, like, comment, filter and delete', async ({ page }) => {
  const content = unique('E2E community post');
  const commentText = unique('E2E comment');
  let postId = null;

  await loginViaUi(page, state.member);
  try {
    await page.goto('/community');
    await page.getByRole('button', { name: 'Create post' }).click();
    const dialog = page.getByRole('dialog', { name: 'Create a post' });
    await dialog.getByLabel('Description').fill(content);
    await dialog.getByRole('button', { name: 'Publish' }).click();
    await expect(dialog).toBeHidden({ timeout: 20_000 });
    await expect(page.getByText(content)).toBeVisible();

    const mine = await api('/posts?mine=true&size=50', { token: state.member.token });
    const post = (mine.data || []).find((item) => item.content === content);
    expect(post, 'created post was not returned by the live API').toBeTruthy();
    postId = post.id;

    const article = articleWithText(page, content);
    await article.getByRole('button', { name: 'Like post' }).click();
    await expect(article.getByRole('button', { name: 'Unlike post' })).toBeVisible();
    await article.getByRole('button', { name: 'Unlike post' }).click();
    await expect(article.getByRole('button', { name: 'Like post' })).toBeVisible();

    await article.getByRole('button', { name: /comments/ }).click();
    await article.getByLabel('Add a comment').fill(commentText);
    await article.getByRole('button', { name: 'Comment', exact: true }).click();
    await expect(article.getByText(commentText)).toBeVisible();
    await article
      .getByRole('button', { name: `Delete comment by ${state.member.fullName}` })
      .click();
    await expect(article.getByText(commentText)).toBeHidden();

    await page.getByLabel('Only my posts').check();
    await page.getByRole('button', { name: 'Project' }).click();
    await expect(page.getByText('No posts match this filter')).toBeVisible();
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(page.getByText(content)).toBeVisible();

    const owned = articleWithText(page, content);
    await owned.getByRole('button', { name: 'Delete' }).click();
    const confirm = page.getByRole('dialog', { name: 'Delete post' });
    await expect(confirm).toBeVisible();
    await confirm.getByRole('button', { name: 'Delete post' }).click();
    await expect(page.getByText(content)).toBeHidden({ timeout: 10_000 });
    postId = null;
  } finally {
    if (postId) await deletePost(postId);
  }
});
