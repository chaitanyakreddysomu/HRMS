import { defineConfig } from '@playwright/test';
import 'dotenv/config';

export default defineConfig({
  testDir: './tests',

  fullyParallel: false,

  forbidOnly: !!process.env.CI,

  retries: process.env.CI ? 2 : 0,

  workers: process.env.CI ? 1 : undefined,

  timeout: 60_000,

  expect: {
    timeout: 10_000,
  },

  reporter: [
    ['list'],
    [
      'html',
      {
        open: 'never',
        outputFolder: './playwright-report',
      },
    ],
  ],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',

    screenshot: 'only-on-failure',

    trace: 'on-first-retry',

    video: 'off',

    actionTimeout: 10_000,

    navigationTimeout: 30_000,

    ignoreHTTPSErrors: true,
  },

  outputDir: './test-results',

  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    {
      name: 'edge',
      use: {
        channel: 'msedge',
        viewport: null,
        launchOptions: {
          args: ['--start-maximized'],
          slowMo: process.env.PW_SLOWMO
            ? Number(process.env.PW_SLOWMO)
            : 0,
        },
      },
      dependencies: ['setup'],
    },
  ],

  // webServer: [
  //   {
  //     command: 'cd ../frontend && npm run dev',
  //     url: 'http://localhost:5173',
  //     reuseExistingServer: !process.env.CI,
  //     timeout: 120_000,
  //   },
  //   {
  //     command: 'cd ../backend && npm run dev',
  //     url: 'http://localhost:5000',
  //     reuseExistingServer: !process.env.CI,
  //     timeout: 120_000,
  //   },
  // ],
});