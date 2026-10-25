import { expect, test } from "@playwright/test";
import { btn, mockApis, onboard, pickLang } from "./helpers";

test.describe("onboarding & language", () => {
  test("follows the phone language: Russian phone → Russian UI", async ({ browser }) => {
    const ctx = await browser.newContext({ locale: "ru-RU" });
    const page = await ctx.newPage();
    await mockApis(page);
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Начать" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "ru");
    await ctx.close();
  });

  test("follows the phone language: English phone → English UI", async ({ browser }) => {
    const ctx = await browser.newContext({ locale: "en-US" });
    const page = await ctx.newPage();
    await mockApis(page);
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Get started" })).toBeVisible();
    await ctx.close();
  });

  test("language can be switched on the first screen and later in Settings", async ({ page }) => {
    await mockApis(page);
    await onboard(page, { lang: "en" });
    await expect(page.getByRole("heading", { name: "Hi, Oleg!" })).toBeVisible();
    await page.getByRole("navigation").getByRole("button", { name: "Settings" }).click();
    await page.getByRole("button", { name: /^Interface language/ }).click();
    await page.getByRole("dialog").getByRole("radio", { name: "Русский" }).click();
    await expect(page.getByRole("heading", { name: "Настройки" })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("button", { name: "Главная" })).toBeVisible();
    // survives a restart
    await page.reload();
    await expect(page.getByRole("navigation").getByRole("button", { name: "Главная" })).toBeVisible();
  });

  test("follows the phone language: Ukrainian phone → Ukrainian UI", async ({ browser }) => {
    const ctx = await browser.newContext({ locale: "uk-UA" });
    const page = await ctx.newPage();
    await mockApis(page);
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "uk");
    await expect(page.locator(".lang-btn")).toContainText("Українська");
    await ctx.close();
  });

  test("an unsupported phone language falls back to English", async ({ browser }) => {
    const ctx = await browser.newContext({ locale: "ja-JP" });
    const page = await ctx.newPage();
    await mockApis(page);
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Get started" })).toBeVisible();
    await ctx.close();
  });

  test("works without an AI key and says so", async ({ page }) => {
    await mockApis(page);
    await onboard(page);
    await expect(page.getByRole("heading", { name: "Чему хотите научиться?" })).toBeVisible();
    await expect(btn(page, /Новый навык/)).toBeVisible();
    await expect(btn(page, /Импорт курса/)).toBeVisible();
  });

  test("an API key is verified before it is saved", async ({ page }) => {
    const api = await mockApis(page, "ok");
    await onboard(page, { key: "sk-ant-test-0123456789abcdef" });
    expect(api.calls.some((c) => c.includes("/v1/models"))).toBe(true);
    await page.getByRole("navigation").getByRole("button", { name: "Настройки" }).click();
    await expect(page.getByText("Работает", { exact: true }).first()).toBeVisible();
  });

  test("a rejected key shows a clear error and lets you continue without AI", async ({ page }) => {
    await mockApis(page, "auth");
    await page.goto("/");
    await pickLang(page, "Русский");
    await btn(page, "Начать").click();
    await page.locator("#name").fill("Олег");
    await btn(page, /Продолжить/).click();
    await page.locator("#key").fill("sk-ant-wrong-0123456789abcdef");
    await btn(page, /Сохранить и начать/).click();
    await expect(page.getByRole("alert")).toContainText("Ключ API отклонён");
    await btn(page, "Продолжить без AI").click();
    await expect(page.getByRole("navigation")).toBeVisible();
  });
});
