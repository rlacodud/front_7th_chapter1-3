import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  reporter: [['list'], ['html']],
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
  },
  webServer: [
    {
      command: 'TEST_ENV=e2e pnpm run server',
      port: 3000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm run start',
      port: 5173,
      reuseExistingServer: !process.env.CI,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
  // Global setup to reset e2e data before each test
  globalSetup: undefined,
});
