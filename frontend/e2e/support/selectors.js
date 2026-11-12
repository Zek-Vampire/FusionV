/** Returns the first article/card containing the exact unique text. */
export function articleWithText(page, text) {
  return page.locator('article').filter({ hasText: text }).first();
}

export function teamCard(page, teamName) {
  return page.locator('article', {
    has: page.getByRole('link', { name: teamName }),
  }).first();
}

export function listItemWithText(page, text) {
  return page.locator('li').filter({ hasText: text }).first();
}
