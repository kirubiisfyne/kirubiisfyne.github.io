import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/acceptance',
  testMatch: '*.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5489',
    browserName: 'chromium',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 832 } } },
    { name: 'mobile', use: { viewport: { width: 375, height: 812 } } },
  ],
  webServer: {
    command: 'npm run dev -- --mode acceptance --host 127.0.0.1 --port 5489 --strictPort',
    url: 'http://127.0.0.1:5489/tests/acceptance/index.html',
    reuseExistingServer: false,
  },
});
