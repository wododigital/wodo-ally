import { defineConfig } from "playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  workers: 5,
  timeout: 60_000,
  retries: 0,
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    viewport: { width: 1440, height: 900 },
  },
  reporter: [
    ["list"],
    ["json", { outputFile: "./reports/results.json" }],
  ],
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        // Bypass CSP that blocks Supabase client's eval usage
        bypassCSP: true,
      },
    },
  ],
});
