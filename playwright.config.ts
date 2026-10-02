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
    // قيود الجهاز (2026-09-29): المضيف 1.9 GB بلا مبادلة، والسويت الكامل (51 اختبارًا في عاملٍ واحد) كان
    // يُنهي جلسة Chromium مرة في أواخر التشغيل (`session closed` + مهلات 30 ث على /settings). هذه أعلام
    // استقرار قياسية لا تُغيّر أي تأكيد أو مهلة، وخادم البناء صار كومته 384 MB ليبقى للمتصفح متّسع.
    launchOptions: {
      // Optional local QA executable when the sandbox cannot reach Playwright's CDN.
      // CI defaults to its pinned full Chromium; no browser is downloaded into Git.
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
      args: ["--disable-dev-shm-usage", "--disable-gpu", "--disable-software-rasterizer"],
    },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "NODE_OPTIONS=--max-old-space-size=384 npm run start -- --hostname 0.0.0.0 --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],
});
