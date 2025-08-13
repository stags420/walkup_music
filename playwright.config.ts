import { defineConfig, devices } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

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
        outputFile: 'test/reports/e2e/report/index.html',
        coverage: process.env.VITE_ENABLE_COVERAGE ? {
          // Filter applies to both entries and sources. Order matters.
          filter: {
            '**/node_modules/**': false,
            '**/@vite/**': false,
            '**/vite/**': false,
            '**/test/**': false,
            '**/src/**': true,
            '**/**': false,
          },
          // Normalize file paths to project src/* for V8 entries
          sourcePath: (filePath: string, info: unknown) => {
            let sp = String(filePath || '').replaceAll('\\', '/');
            if (sp.startsWith('file://')) sp = sp.replace(/^file:\/+/, '/');
            if (sp.includes('/src/')) {
              const i = sp.indexOf('/src/');
              return sp.slice(i + 1);
            }
            const rawUrl = info && typeof info === 'object' ? String((info as Record<string, unknown>).url || '') : '';
            if (rawUrl) {
              const m = rawUrl.match(/\/src\/[^?#]*/);
              if (m && m[0]) return m[0].replace(/^\//, '');
            }
            const distFile = info && typeof info === 'object' ? String((info as Record<string, unknown>).distFile || '') : '';
            if (distFile && distFile.includes('src/')) return distFile.slice(distFile.indexOf('src/'));
            return sp.replace(/^\//, '');
          },
          // Transpile TS/TSX on the fly so MCR can analyze metrics correctly
          onEntry: async (
            entry: {
              url?: string;
              source?: string;
              sourceMap?: unknown;
              distFile?: string;
            }
          ): Promise<void> => {
            if (!entry || typeof entry.url !== 'string') return;
            let url = entry.url;
            if (url.startsWith('file://')) url = url.replace(/^file:\/+/, '/');
            const lower = url.toLowerCase();
            if (!lower.includes('/src/') || !/\.(ts|tsx)$/.test(lower)) return;
            const cwd = process.cwd();
            const absolutePath = url.startsWith('/') ? url : path.join(cwd, url);
            try {
              const tsSource = fs.readFileSync(absolutePath, 'utf8');
              const transpiled = ts.transpileModule(tsSource, {
                compilerOptions: {
                  module: ts.ModuleKind.ESNext,
                  target: ts.ScriptTarget.ES2022,
                  jsx: ts.JsxEmit.ReactJSX,
                  sourceMap: true,
                },
                fileName: absolutePath,
              });
              if (transpiled && typeof transpiled.outputText === 'string') {
                entry.source = transpiled.outputText;
                if (transpiled.sourceMapText) {
                  try {
                    entry.sourceMap = JSON.parse(transpiled.sourceMapText);
                  } catch (error) {
                    void error;
                  }
                }
                entry.distFile = 'src/' + path.relative(path.join(cwd, 'src'), absolutePath).replaceAll('\\', '/');
              }
            } catch (error) {
              void error;
            }
          },
          // Generate standalone HTML coverage (V8 UI) and save raw dumps
          outputDir: 'test/reports/e2e/coverage/report',
          clean: true,
          reports: [
            ['raw', { outputDir: 'test/reports/e2e/coverage/dumps' }],
            'v8',
            'console-summary',
          ],
        } : {},
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
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  
  /* Increase test timeout */
  timeout: 60_000,

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

  /* Always run Vite dev server; invoker can set env (e.g., VITE_MOCK_AUTH, VITE_ENABLE_COVERAGE) */
  webServer: {
    command: 'vite --host=127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173/walkup_music/',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});