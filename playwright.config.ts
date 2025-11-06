import { defineConfig, devices } from '@playwright/test';

// pnpm과 npm 모두 지원
// CI 환경에서는 pnpm을 사용하고, 로컬에서는 npm_execpath를 확인하여 자동 감지
const packageManager =
  process.env.CI === 'true' || process.env.npm_execpath?.includes('pnpm') ? 'pnpm' : 'npm';

export default defineConfig({
  testDir: './e2e',
  reporter: [['list'], ['html']],
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
  },
  webServer: [
    {
      command: `TEST_ENV=e2e ${packageManager} run server`,
      port: 3000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `${packageManager} run start`,
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
