/**
 * End-to-end tests of the web build across browser engines and device sizes.
 * Android phones/tablets → Chromium (the Android WebView engine);
 * iPhone/iPad → WebKit (the iOS WKWebView engine); plus desktop browsers.
 * CI runs every project; locally `npm run e2e` runs the Chromium ones.
 */
import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}/`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    serviceWorkers: "block",
  },
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [
    // Android (Chromium = Android System WebView engine)
    { name: "android-pixel-7", use: { ...devices["Pixel 7"] } },
    { name: "android-galaxy-s9", use: { ...devices["Galaxy S9+"] } }, // 320 px wide
    { name: "android-small-360", use: { ...devices["Pixel 5"], viewport: { width: 360, height: 640 } } },
    { name: "android-tablet", use: { ...devices["Galaxy Tab S4"] } },
    { name: "android-landscape", use: { ...devices["Pixel 7 landscape"] } },
    // iOS (WebKit = WKWebView engine)
    { name: "iphone-se", use: { ...devices["iPhone SE"] } }, // 320 px wide
    { name: "iphone-15-pro-max", use: { ...devices["iPhone 15 Pro Max"] } },
    { name: "ipad-mini", use: { ...devices["iPad Mini"] } },
    // desktop browsers (web preview)
    { name: "desktop-chrome", use: { ...devices["Desktop Chrome"] } },
    { name: "desktop-firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "desktop-safari", use: { ...devices["Desktop Safari"] } },
  ],
});
