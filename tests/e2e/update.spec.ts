import { expect, test } from "@playwright/test";
import { btn, mockApis, onboard } from "./helpers";

const release = (tag: string) => ({
  tag_name: tag,
  body: "notes",
  html_url: `https://github.com/helgurkonungson/pes-app/releases/tag/${tag}`,
  published_at: "2026-10-23T18:00:00Z",
  assets: [{ name: `PES-${tag.slice(1)}.apk`, browser_download_url: `https://github.com/x/PES-${tag.slice(1)}.apk` }],
});

test.describe("check for updates", () => {
  test("no newer release → says so right in the row", async ({ page }) => {
    await mockApis(page);
    await page.route("https://api.github.com/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(release("v0.0.1")) }));
    await onboard(page);
    await page.getByRole("navigation").getByRole("button", { name: "Настройки" }).click();
    await btn(page, /Проверить обновления/).click();
    await expect(page.locator(".menu-row", { hasText: "Проверить обновления" })).toContainText(/У вас последняя версия · проверено в \d/);
  });

  test("newer release → install row appears", async ({ page }) => {
    await mockApis(page);
    await page.route("https://api.github.com/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(release("v9.9.9")) }));
    await onboard(page);
    await page.getByRole("navigation").getByRole("button", { name: "Настройки" }).click();
    await btn(page, /Проверить обновления/).click();
    await expect(page.locator(".menu-row", { hasText: "Проверить обновления" })).toContainText("Доступна версия 9.9.9");
    await expect(btn(page, /Установить 9\.9\.9/)).toBeVisible();
  });

  test("GitHub unreachable → visible error", async ({ page }) => {
    await mockApis(page);
    await page.route("https://api.github.com/**", (r) => r.abort("internetdisconnected"));
    await onboard(page);
    await page.getByRole("navigation").getByRole("button", { name: "Настройки" }).click();
    await btn(page, /Проверить обновления/).click();
    await expect(page.locator(".menu-row", { hasText: "Проверить обновления" })).toContainText("Не удалось связаться с GitHub");
  });
});
