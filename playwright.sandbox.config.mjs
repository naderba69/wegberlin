import base from "./playwright.config.ts";
export default {
  ...base,
  use: {
    ...base.use,
    launchOptions: {
      executablePath: "/tmp/chromium/chromium",
      args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
    },
  },
};
