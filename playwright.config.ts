import { defineConfig } from "@playwright/test";

/**
 * End-to-end system tests: they drive the real production build in a browser.
 * `npm run test:e2e` builds the app first; the browsers are the Edge and Chrome
 * already installed on the machine, so nothing extra is downloaded.
 */
const PORT = 3210;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
  projects: [
    { name: "desktop-edge", use: { channel: "msedge", viewport: { width: 1280, height: 860 } } },
    { name: "desktop-chrome", use: { channel: "chrome", viewport: { width: 1280, height: 860 } } },
    { name: "phone-375", use: { channel: "msedge", viewport: { width: 375, height: 812 }, hasTouch: true } },
  ],
});
