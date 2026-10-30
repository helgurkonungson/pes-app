/** On short phones (360 × 640, 320 × 568) the main actions must be reachable without scrolling. */
import { expect, test } from "@playwright/test";
import { btn, mockApis } from "./helpers";

for (const size of [
  { width: 360, height: 640 },
  { width: 320, height: 568 },
]) {
  test(`onboarding buttons stay on screen at ${size.width}×${size.height}`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: size, locale: "ru-RU", hasTouch: true });
    const page = await ctx.newPage();
    await mockApis(page);
    await page.goto("/");
    await expect(btn(page, "Начать")).toBeInViewport({ ratio: 1 });
    await btn(page, "Начать").click();
    await page.locator("#name").fill("Олег");
    await expect(btn(page, /Продолжить/)).toBeInViewport({ ratio: 1 });
    await btn(page, /Продолжить/).click();
    await expect(btn(page, "Продолжить без ИИ")).toBeInViewport({ ratio: 1 });
    await expect(btn(page, /Сохранить и начать/)).toBeInViewport({ ratio: 1 });
    await btn(page, "Продолжить без ИИ").click();
    await expect(page.getByRole("navigation")).toBeVisible();
    await ctx.close();
  });
}
