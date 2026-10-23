import { expect, test } from "@playwright/test";
import { btn, createSkillsetWithText, finishLesson, mockApis, onboard, skipCountdown } from "./helpers";

test.describe("lessons without AI", () => {
  test("no key: a full lesson from your own source, then progress updates", async ({ page }) => {
    await mockApis(page);
    await onboard(page);
    await createSkillsetWithText(page);
    await expect(page.locator(".hero .pill").first()).toHaveText("Без AI");
    await btn(page, /Начать · 15 мин/).click();
    await skipCountdown(page);
    await expect(page.getByText("Ключа AI нет, поэтому урок собран из вашего источника.")).toBeVisible();
    await expect(page.getByText(/Чтение · часть 1 из/)).toBeVisible();
    await finishLesson(page);
    await btn(page, "Закрыть").click();
    await expect(page.locator(".stat-cards")).toContainText("1");
    await btn(page, "Назад").click();
    await page.getByRole("navigation").getByRole("button", { name: "Главная" }).click();
    await expect(page.getByRole("button", { name: /Серия: 1 день/ })).toBeVisible();
    await expect(page.locator(".next-title")).toHaveText("Урок 2");
  });

  test("credits ran out: lessons continue offline and the app explains why", async ({ page }) => {
    const api = await mockApis(page, "credits");
    await onboard(page, { key: "sk-ant-test-0123456789abcdef" });
    await createSkillsetWithText(page);
    // the placement test needs AI → credits error → skipped, lesson built offline
    await btn(page, /Пройти входной тест|Начать/).click();
    await skipCountdown(page);
    await expect(page.getByText("Кредиты AI закончились, поэтому этот урок собран из вашего источника без AI.")).toBeVisible();
    expect(api.calls.some((c) => c.includes("/v1/messages"))).toBe(true);
    await finishLesson(page);
    await btn(page, "Закрыть").click();
    await btn(page, "Назад").click();
    await page.getByRole("navigation").getByRole("button", { name: "Главная" }).click();
    await expect(page.getByText(/Кредиты AI закончились — уроки строятся/)).toBeVisible();
    await page.getByRole("navigation").getByRole("button", { name: "Настройки" }).click();
    await expect(page.getByText("Кредиты закончились — уроки без AI")).toBeVisible();
    // the next lesson doesn't hit the API again
    const before = api.calls.filter((c) => c.includes("/v1/messages")).length;
    await page.getByRole("navigation").getByRole("button", { name: "Главная" }).click();
    await btn(page, /^Начать$/).click();
    await skipCountdown(page);
    await expect(page.getByText("Коротко о прошлом уроке")).toBeVisible(); // lesson 2 starts with a review
    await expect(page.locator(".mode-tag.offline")).toBeVisible();
    expect(api.calls.filter((c) => c.includes("/v1/messages")).length).toBe(before);
  });

  test("no internet: the error screen offers to study without AI", async ({ page }) => {
    await mockApis(page, "ok");
    await onboard(page, { key: "sk-ant-test-0123456789abcdef" });
    await page.unroute("https://api.anthropic.com/**");
    await page.route("https://api.anthropic.com/**", (r) => r.abort("internetdisconnected"));
    await createSkillsetWithText(page);
    await btn(page, "Пропустить").click(); // skip the placement test
    await btn(page, /Начать · 15 мин/).click();
    await expect(page.getByRole("alert")).toContainText("Нет связи с сервисом AI");
    await btn(page, "Заниматься без AI").click();
    await skipCountdown(page);
    await expect(page.getByText(/Чтение · часть 1 из/)).toBeVisible();
  });

  test("'Always without AI' in Settings never calls the API", async ({ page }) => {
    const api = await mockApis(page, "ok");
    await onboard(page, { key: "sk-ant-test-0123456789abcdef" });
    await page.getByRole("navigation").getByRole("button", { name: "Настройки" }).click();
    await page.getByRole("radio", { name: "Всегда без AI" }).click();
    await createSkillsetWithText(page);
    const before = api.calls.length;
    await btn(page, /Начать · 15 мин/).click();
    await skipCountdown(page);
    await expect(page.getByText(/Чтение · часть 1 из/)).toBeVisible();
    expect(api.calls.length).toBe(before);
  });

  test("leaving a lesson keeps the progress", async ({ page }) => {
    await mockApis(page);
    await onboard(page);
    await createSkillsetWithText(page);
    await btn(page, /Начать · 15 мин/).click();
    await skipCountdown(page);
    await btn(page, /^Далее/).click();
    await btn(page, "Выйти из урока").click();
    await page.getByRole("dialog").getByRole("button", { name: "Выйти" }).click();
    await expect(btn(page, "Продолжить урок")).toBeVisible();
    await btn(page, "Продолжить урок").click();
    await expect(page.locator(".page-count")).toContainText("2");
  });
});
