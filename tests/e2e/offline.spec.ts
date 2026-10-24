import { expect, test } from "@playwright/test";
import { btn, createSkillsetWithText, finishLesson, mockApis, onboard, skipCountdown, skipPlacementUI } from "./helpers";

const para = (topic: string) =>
  Array.from({ length: 8 }, (_, i) => `${topic} помогает команде принимать решения на основе фактов, и это правило номер ${i + 1} для любого руководителя данных в компании.`).join(" ");

const BOOK = [
  "УДК 004.6\nББК 32.97\nISBN 978-5-00000-000-0\n© Иван Петров, 2024\nВсе права защищены.",
  "СОДЕРЖАНИЕ\nПредисловие . . . . . . . 7\nВведение ........ 9\nГлава 1. Что такое данные ........ 13\nГлава 2. Качество ........ 41\nГлава 3. Метаданные ........ 77",
  `ПРЕДИСЛОВИЕ\n${para("Эта книга писалась долго и")}`,
  `ВВЕДЕНИЕ\n${para("Вводная глава")}`,
  "\u0007\uFFFD 12",
  `Глава 1. Что такое данные\n${para("Понимание данных")}\n\n${para("Каталог данных")}`,
  `Глава 2. Качество\n${para("Контроль качества")}`,
].join("\n\n");

test.describe("lessons without AI", () => {
  test("a book: the lesson starts at Chapter 1 — no imprint, contents, preface, intro or control characters", async ({ page }) => {
    await mockApis(page);
    await onboard(page);
    await page.getByRole("navigation").getByRole("button", { name: "Навыки" }).click();
    await btn(page, /Новый навык/).click();
    await page.locator("#sk-name").fill("Книга");
    await btn(page, /Создать и добавить источники/).click();
    await btn(page, "Вставить текст").click();
    await page.getByRole("dialog").getByRole("textbox", { name: "Вставить текст" }).fill(BOOK);
    await page.getByRole("dialog").getByRole("button", { name: "Добавить текст" }).click();
    await expect(page.getByText(/Текст · .* слов/)).toBeVisible();
    await btn(page, "Назад").click();
    await skipPlacementUI(page);
    await btn(page, /Начать · 5 мин|Начать/).click();
    await skipCountdown(page);
    await expect(page.locator(".session-body")).toContainText("Понимание данных");
    const text = await page.locator(".session-body").innerText();
    expect(text).not.toMatch(/ISBN|СОДЕРЖАНИЕ|ПРЕДИСЛОВИЕ|ВВЕДЕНИЕ|писалась долго|Вводная глава|\uFFFD/);
    expect(text).not.toMatch(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/);
  });

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
    await createSkillsetWithText(page, undefined, { keepTest: true });
    // the AI can't write the placement test (no credits) → it is built from the sources instead
    await btn(page, /Пройти входной тест/).click();
    await skipCountdown(page);
    await expect(page.getByText(/Короткий тест по вашим материалам/)).toBeVisible();
    for (let i = 0; i < 12 && !(await page.getByRole("button", { name: "Завершить" }).isVisible()); i++) {
      const option = page.locator(".option:not([disabled])").first();
      if (await option.isVisible().catch(() => false)) await option.click();
      await btn(page, /^Далее/).click();
    }
    const last = page.locator(".option:not([disabled])").first();
    if (await last.isVisible().catch(() => false)) await last.click();
    await btn(page, "Завершить").click();
    await expect(page.getByText(/Уровень: /)).toBeVisible();
    await btn(page, "Закрыть").click();
    await btn(page, /Начать · 15 мин/).click();
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
