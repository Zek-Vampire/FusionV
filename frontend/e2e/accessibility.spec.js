import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { loginViaUi, state } from './support/helpers';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function scan(page, route) {
  await page.goto(route);
  await page.waitForTimeout(700);
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const blocking = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );
  const summary = results.violations
    .map((item) => `${item.id}:${item.impact}`)
    .join(', ');
  console.log(`axe ${route}: ${results.violations.length} violation(s)${summary ? ` — ${summary}` : ''}`);
  if (results.violations.length) {
    await test.info().attach(`axe-${route.replace(/\W+/g, '-')}.json`, {
      body: JSON.stringify(results.violations, null, 2),
      contentType: 'application/json',
    });
  }
  expect(
    blocking,
    `${route} serious/critical axe violations: ${blocking
      .map((item) => `${item.id} (${item.nodes.length})`)
      .join(', ')}`,
  ).toEqual([]);
  return results.violations.length;
}

test.describe.configure({ mode: 'serial' });
test('public and authenticated pages have no serious axe violations', async ({ page }) => {
  const publicRoutes = ['/', '/login', '/signup'];
  for (const route of publicRoutes) await scan(page, route);

  await loginViaUi(page, state.member);
  const authenticatedRoutes = [
    '/dashboard',
    '/teams',
    '/community',
    '/students',
    `/messages?team=${state.team.id}`,
    '/notifications',
    '/profile',
    '/settings',
    '/resources/mine',
  ];
  for (const route of authenticatedRoutes) await scan(page, route);
});
