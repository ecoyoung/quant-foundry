import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  use: { baseURL: "http://127.0.0.1:4173", trace: "retain-on-failure" },
  projects: [{ name:"desktop", use:{...devices["Desktop Chrome"],browserName:"chromium",channel:"chrome"} },{ name:"mobile", use:{...devices["iPhone 13"],browserName:"chromium",channel:"chrome"} }],
});
