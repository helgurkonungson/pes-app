import { expect, test } from "@playwright/test";
import { btn, createSkillsetWithText, finishLesson, mockApis, onboard, skipCountdown } from "./helpers";

test.describe("AI lessons (mocked Claude API)", () => {
  test("placement test → AI lesson → AI-graded open answer", async ({ page }) => {
    await mockApis(page, "ok");
    await onboard(page, { key: "sk-ant-test-0123456789abcdef" });
    await createSkillsetWithText(page);
    await expect(page.locator(".hero .pill").first()).toHaveText("Уроки с AI");
    await btn(page, "Пройти входной тест").click();
    await skipCountdown(page);
    await expect(page.getByRole("heading", { name: "Определим ваш стартовый уровень" })).toBeVisible();
    for (let i = 0; i < 7; i++) {
      const opt = page.locator(".option:not([disabled])").first();
      if (await opt.isVisible().catch(() => false)) await opt.click();
      const fin = page.getByRole("button", { name: "Завершить" });
      if (await fin.isVisible().catch(() => false)) break;
      await btn(page, /^Далее/).click();
    }
    await btn(page, "Завершить").click();
    await expect(page.getByText(/Уровень: (начальный|средний|продвинутый)/)).toBeVisible();
    await btn(page, "Закрыть").click();
    await btn(page, /Начать · 15 мин/).click();
    await skipCountdown(page);
    await expect(page.getByText("Коротко о прошлом уроке")).toBeVisible();
    await finishLesson(page, { aiGrade: true });
  });

  test("model list loads in Settings", async ({ page }) => {
    await mockApis(page, "ok");
    await onboard(page, { key: "sk-ant-test-0123456789abcdef" });
    await page.getByRole("navigation").getByRole("button", { name: "Настройки" }).click();
    await btn(page, /Модель/).click();
    await expect(page.getByRole("dialog").getByText("Claude Sonnet 5.5")).toBeVisible();
  });
});

test.describe("other AI providers", () => {
  test("ChatGPT key in Settings → lesson written by OpenAI-compatible API", async ({ page }) => {
    await mockApis(page, "credits"); // Claude would fail — proves the lesson comes from OpenAI
    const calls: string[] = [];
    await page.route("https://api.openai.com/**", async (route) => {
      const url = route.request().url();
      calls.push(url);
      if (url.endsWith("/models")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [{ id: "gpt-5-mini" }, { id: "text-embedding-3-small" }] }) });
      const body = JSON.parse(route.request().postData() ?? "{}");
      const name = body.tool_choice?.function?.name;
      const { AI_LESSON } = await import("./helpers");
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ choices: [{ message: { tool_calls: [{ function: { name, arguments: JSON.stringify(AI_LESSON) } }] } }] }),
      });
    });
    await onboard(page);
    await page.getByRole("navigation").getByRole("button", { name: "Настройки" }).click();
    await page.getByRole("radio", { name: "ChatGPT" }).click();
    await expect(page.getByText(/работает только с Claude/)).toBeVisible();
    await btn(page, /Ключ API ChatGPT/).click();
    await page.getByRole("dialog").getByRole("textbox").fill("sk-openai-test-0123456789");
    await page.getByRole("dialog").getByRole("button", { name: "Проверить и сохранить" }).click();
    await expect(page.getByText("Ключ сохранён")).toBeVisible();
    await expect(page.locator(".menu-row", { hasText: "Модель" })).toContainText("gpt-5-mini");
    await createSkillsetWithText(page);
    await btn(page, "Пропустить").click();
    await btn(page, /Начать · 15 мин/).click();
    await skipCountdown(page);
    await expect(page.getByText("Коротко о прошлом уроке")).toBeVisible(); // AI_LESSON has a review step
    expect(calls.some((c) => c.endsWith("/chat/completions"))).toBe(true);
  });

  test("Alice AI needs the Yandex folder ID before the key", async ({ page }) => {
    await mockApis(page);
    await onboard(page);
    await page.getByRole("navigation").getByRole("button", { name: "Настройки" }).click();
    await page.getByRole("radio", { name: "Алиса AI" }).click();
    await expect(page.getByText("ID каталога Yandex Cloud")).toBeVisible();
    await btn(page, /Ключ API Алиса AI/).click();
    await page.getByRole("dialog").getByRole("textbox").fill("AQVN-test-0123456789abcdef");
    await page.getByRole("dialog").getByRole("button", { name: "Проверить и сохранить" }).click();
    await expect(page.getByRole("alert")).toContainText("Сначала укажите ID каталога");
  });
});
