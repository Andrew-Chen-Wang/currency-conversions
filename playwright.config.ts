import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./src/__tests__",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "https://www.oanda.com",
    trace: "on-first-retry",
    actionTimeout: 60000,
    navigationTimeout: 60000,
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          headless: true,
          args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
        },
      },
    },
  ],
});
