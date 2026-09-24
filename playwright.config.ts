import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: "line",
  use: {
    baseURL: "http://127.0.0.1:3100",
    channel: "chromium", // full Chromium's new headless mode avoids repeated headless-shell SIGSEGV in long media/Offline suites
    trace: "retain-on-failure",
  },
  webServer: {
    command: "NODE_OPTIONS=--max-old-space-size=512 npm run start -- --hostname 0.0.0.0 --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],
});
