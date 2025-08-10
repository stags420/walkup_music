import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './test/e2e',
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['list'],
    [
      'monocart-reporter',
      {
        outputFile: 'test/reports/monocart/index.html',
        ...((process.env.VITE_E2E_COVERAGE)
          ? {
              coverage: {
                include: ['**/src/**'],
                exclude: ['**/node_modules/**', '**/@vite/**', '**/vite/**'],
                // V8-only reports
                reports: ['v8', 'v8-json', 'console-summary'],
              },
            }
          : {}),
      },
    ],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:4173/walkup_music',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Increase timeout for mobile tests */
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  
  /* Increase test timeout */
  timeout: 60000,

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['iPhone 15 Pro'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 15 Pro'] },
    },
  ],

  /* Always run against the built preview (dist-mocked) */
  webServer: {
    command: 'npx vite preview --port 4173 --host 127.0.0.1 --outDir dist-mocked',
    url: 'http://127.0.0.1:4173/walkup_music/',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});