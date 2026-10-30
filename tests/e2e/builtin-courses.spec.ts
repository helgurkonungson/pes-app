import { expect, test } from "@playwright/test";
import { btn, finishLesson, mockApis, onboard, skipCountdown } from "./helpers";

/** Opens the first-run tutorial on its last step ("Where shall we start?"). */
async function toStartStep(page: import("@playwright/test").Page, lang: "ru" | "en" = "ru"): Promise<void> {
  await onboard(page, { tutorial: true, lang });
  const tut = page.locator(".tutorial");
  for (let i = 0; i < 5; i++) await tut.locator(".tut-actions .btn.primary").click();
  await expect(tut.locator("[data-course]")).toHaveCount(5);
}

async function leaveLesson(page: import("@playwright/test").Page): Promise<void> {
  await btn(page, "Выйти из урока").click();
  await page.getByRole("dialog").getByRole("button", { name: "Выйти" }).click();
  await expect(page.locator(".session-body")).toHaveCount(0);
}

test.describe("built-in courses (ADR-031)", () => {
  test("tutorial → a free course opens its first lesson at once, without AI and without a placement test", async ({ page }) => {
    const api = await mockApis(page, "ok");
    await toStartStep(page);
    await page.locator('.tutorial [data-course="money"]').click();
    await expect(page.locator(".tutorial")).toHaveCount(0);
    await skipCountdown(page);
    await expect(page.locator(".mode-tag.course")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Сначала — учет" })).toBeVisible(); // lesson 1, theory part 1
    await finishLesson(page, {
      // no AI yet: the open question offers to connect a free AI (the main feature) — right there
      atOpenQuestion: async () => {
        const cta = page.getByTestId("open-ai-cta");
        await expect(cta).toContainText("Пусть ИИ проверит ответ");
        await cta.getByRole("button", { name: "Подключить бесплатный ИИ" }).click();
        await expect(page.getByRole("dialog", { name: "Бесплатный ИИ" })).toBeVisible();
        await page.getByRole("dialog", { name: "Бесплатный ИИ" }).getByRole("button", { name: "Закрыть" }).click();
        await expect(page.getByRole("dialog")).toHaveCount(0);
      },
    });
    await btn(page, "Закрыть").click();
    await expect(page.getByRole("heading", { name: "Финансовая грамотность" })).toBeVisible();
    await expect(page.locator(".syllabus-row")).toHaveCount(8);
    await expect(page.locator(".syllabus-row").first().locator(".status.done")).toBeVisible();
    expect(api.calls.filter((c) => c.includes("/v1/messages"))).toHaveLength(0); // courses never call AI
    // the tutorial is done for good
    await page.reload();
    await expect(page.locator(".tutorial")).toHaveCount(0);
  });

  test("the course follows the interface language", async ({ page }) => {
    await mockApis(page);
    await toStartStep(page, "en");
    await page.locator('.tutorial [data-course="thinking"]').click();
    await skipCountdown(page);
    await expect(page.getByRole("heading", { name: "What an argument is made of" })).toBeVisible();
  });

  test("Skillsets lists the free courses; opening one twice doesn't add it twice", async ({ page }) => {
    await mockApis(page);
    await onboard(page);
    await page.getByRole("navigation").getByRole("button", { name: "Навыки" }).click();
    const section = page.getByTestId("builtin-courses");
    await expect(section.getByRole("heading", { name: "Бесплатные курсы" })).toBeVisible();
    await section.locator('[data-course="learning"]').click();
    await skipCountdown(page);
    await expect(page.locator(".mode-tag.course")).toBeVisible();
    await leaveLesson(page);
    await btn(page, "Назад").click();
    await expect(page.locator(".skill-card")).toHaveCount(1);
    await expect(section.locator('[data-course="learning"]')).toContainText("Добавлен");
    await section.locator('[data-course="learning"]').click();
    await skipCountdown(page);
    await leaveLesson(page);
    await btn(page, "Назад").click();
    await expect(page.locator(".skill-card")).toHaveCount(1);
  });
});

test.describe("own skill path from the tutorial", () => {
  test("how-to → connect AI → free AI with its catches; back works; Pro opens the placeholder", async ({ page }) => {
    await mockApis(page);
    await toStartStep(page);
    const tut = page.locator(".tutorial");
    await page.getByTestId("tut-own").click();
    await expect(tut.getByRole("heading", { name: "Свой навык в три шага" })).toBeVisible();
    await expect(tut.getByText(/желательно подключить/)).toBeVisible();
    await tut.getByRole("button", { name: /Дальше: подключить ИИ/ }).click();
    await expect(tut.getByText(/ключ \(его еще называют токеном\)/)).toBeVisible();
    await page.getByTestId("own-free").click();
    await expect(tut.getByRole("heading", { name: "Бесплатный ИИ: что важно знать" })).toBeVisible();
    await expect(tut.getByText(/50 запросов в день/)).toBeVisible();
    await expect(tut.getByText(/ошибка 429/)).toBeVisible();
    await tut.getByRole("button", { name: /Получить бесплатный ИИ/ }).click();
    await expect(page.getByRole("dialog", { name: "Бесплатный ИИ" })).toBeVisible(); // the free-AI sheet, above the tutorial
    await page.getByRole("dialog", { name: "Бесплатный ИИ" }).getByRole("button", { name: "Закрыть" }).click();
    await tut.getByRole("button", { name: "Назад" }).click();
    await page.getByTestId("own-pro").click();
    await expect(page.locator(".tutorial")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Chompbook Pro" })).toBeVisible();
    await expect(page.getByTestId("pro-soon")).toContainText("Скоро");
  });

  test("own key explains the token and opens Settings at the provider picker", async ({ page }) => {
    await mockApis(page);
    await toStartStep(page);
    await page.getByTestId("tut-own").click();
    await page.locator(".tutorial .tut-actions .btn.primary").click();
    await page.getByTestId("own-key").click();
    await expect(page.locator(".tutorial").getByText(/console\.anthropic\.com/)).toBeVisible();
    await btn(page, /Открыть настройки ИИ/).click();
    await expect(page.locator(".tutorial")).toHaveCount(0);
    await expect(page.getByRole("dialog", { name: "Провайдер ИИ" })).toBeVisible();
  });

  test("without AI goes straight to creating the skill", async ({ page }) => {
    await mockApis(page);
    await toStartStep(page);
    await page.getByTestId("tut-own").click();
    await btn(page, "Продолжить без ИИ").click();
    await expect(page.locator(".tutorial")).toHaveCount(0);
    await expect(page.locator("#sk-name")).toBeVisible();
  });

  test("with AI already connected the connect step just confirms it", async ({ page }) => {
    await mockApis(page, "ok");
    await onboard(page, { tutorial: true, key: "sk-ant-test-0123456789abcdef" });
    const tut = page.locator(".tutorial");
    for (let i = 0; i < 5; i++) await tut.locator(".tut-actions .btn.primary").click();
    await page.getByTestId("tut-own").click();
    await tut.locator(".tut-actions .btn.primary").click();
    await expect(tut.getByText(/ИИ уже подключен: Claude/)).toBeVisible();
    await tut.getByRole("button", { name: /Создать навык/ }).click();
    await expect(page.locator("#sk-name")).toBeVisible();
  });
});
