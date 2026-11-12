import { defineConfig } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:5173';
const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(baseURL);
const isPreviewPort = /:4173(?:\/|$)/.test(baseURL);

/**
 * Live end-to-end tests. They require the Spring Boot API and a local database.
 * Unit/component tests stay in Vitest; these tests run only through `npm run test:e2e`.
 */
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.js',
  globalTeardown: './e2e/global-teardown.js',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: isLocal
    ? {
        command: isPreviewPort ? 'npm run preview' : 'npm run dev',
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      }
    : undefined,
  projects: [
    {
      name: 'chromium-live',
      use: { channel: 'chrome' },
      testIgnore: /cross-browser\.spec\.js/,
    },
    {
      name: 'chrome-smoke',
      use: { channel: 'chrome' },
      testMatch: /cross-browser\.spec\.js/,
    },
    {
      name: 'firefox-smoke',
      use: { browserName: 'firefox' },
      testMatch: /cross-browser\.spec\.js/,
    },
    {
      name: 'webkit-smoke',
      use: { browserName: 'webkit' },
      testMatch: /cross-browser\.spec\.js/,
    },
  ],
});
