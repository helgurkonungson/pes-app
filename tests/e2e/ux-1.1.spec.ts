import { expect, test } from "@playwright/test";
import { btn, createSkillsetWithText, mockApis, onboard, skipCountdown } from "./helpers";

/** 1.1.0 UX pass: Home energy and week, the lesson header, wrong answers explained, dictation, photo sources. */
test.describe("1.1.0 UX pass", () => {
  test("Home: the energy chip explains itself; the week runs Monday to Sunday; shortcuts fill the space", async ({ page }) => {
    await mockApis(page);
    await onboard(page);
    const chip = page.getByRole("button", { name: /^Энергия: \d+/ });
    await expect(chip).toHaveClass(/news/);
    await chip.click();
    const sheet = page.getByRole("dialog", { name: "Энергия" });
    await expect(sheet.getByText(/награда за занятия/)).toBeVisible();
    await expect(sheet.getByText(/Пройти урок или тест: \+5/)).toBeVisible(); // "how to earn" is open
    await sheet.getByRole("button", { name: "Закрыть" }).click();
    await expect(chip).not.toHaveClass(/news/);

    const week = page.getByRole("list", { name: "Эта неделя" });
    await expect(week.getByRole("listitem")).toHaveCount(7);
    await expect(week.getByRole("listitem").first()).toHaveAttribute("aria-label", /^пн/);
    await expect(week.locator(".is-today")).toHaveCount(1);
    await expect(week.locator(".is-today")).toHaveAttribute("aria-label", /сегодня, еще нет|выходной/);

    // nothing to study yet: the empty state has its own buttons, no shortcuts
    await expect(page.locator(".quick-actions")).toHaveCount(0);
    // with one skillset, two shortcuts sit under Today
    await page.getByRole("navigation").getByRole("button", { name: "Навыки" }).click();
    await page.getByTestId("builtin-courses").locator('[data-course="learning"]').click();
    await skipCountdown(page);
    await btn(page, "Выйти из урока").click();
    await page.getByRole("dialog").getByRole("button", { name: "Выйти" }).click();
    await page.getByRole("button", { name: "Назад" }).first().click();
    await page.getByRole("navigation").getByRole("button", { name: "Главная" }).click();
    await expect(btn(page, /Добавить книгу/)).toBeVisible();
    await btn(page, /Бесплатные курсы/).click();
    await expect(page.getByTestId("builtin-courses")).toBeVisible();
  });

  test("lesson: one label, a quiet counter and no clock; a wrong pick names both answers", async ({ page }) => {
    await mockApis(page, "ok");
    await onboard(page, { key: "sk-ant-test-0123456789abcdef" });
    await createSkillsetWithText(page);
    await btn(page, /Начать/).click();
    await skipCountdown(page);
    await expect(page.locator(".timer")).toHaveCount(0);
    await expect(page.locator(".session-top .page-count")).toHaveText(/^1\s*\/\s*\d+$/);
    await expect(page.getByRole("progressbar", { name: "Ход урока" })).toHaveAttribute("aria-valuenow", "1");
    for (let i = 0; i < 10 && !(await page.locator(".option:not([disabled])").first().isVisible().catch(() => false)); i++) await btn(page, /^Далее/).click();
    // the mocked right answer is the first option
    await page.locator(".option").nth(1).click();
    const explain = page.locator(".explain");
    await expect(explain).toContainText("Ваш ответ: «Цвет отчетов»");
    await expect(explain).toContainText("Правильно: «Права принятия решений»");
  });

  test("open question: a length hint and dictation where the browser can recognise speech", async ({ page }) => {
    await mockApis(page, "ok");
    await page.addInitScript(() => {
      // a fake recogniser that "hears" one sentence
      class FakeRecognition {
        lang = "";
        interimResults = false;
        maxAlternatives = 1;
        onresult: ((e: unknown) => void) | null = null;
        onerror: ((e: unknown) => void) | null = null;
        onend: (() => void) | null = null;
        start() {
          setTimeout(() => {
            this.onresult?.({ results: [[{ transcript: "Назначу владельца данных" }]] });
            this.onend?.();
          }, 50);
        }
        stop() {}
      }
      const w = window as unknown as { SpeechRecognition: unknown; webkitSpeechRecognition: unknown };
      w.SpeechRecognition = w.webkitSpeechRecognition = FakeRecognition;
    });
    await onboard(page, { key: "sk-ant-test-0123456789abcdef" });
    await createSkillsetWithText(page);
    await btn(page, /Начать/).click();
    await skipCountdown(page);
    const answer = page.getByRole("textbox", { name: "Ваш ответ" });
    for (let i = 0; i < 20 && !(await answer.isVisible().catch(() => false)); i++) {
      const option = page.locator(".option:not([disabled])").first();
      if (await option.isVisible().catch(() => false)) await option.click();
      await btn(page, /^Далее/).click();
    }
    await expect(page.getByText("Достаточно 3–6 предложений. Или нажмите на микрофон и скажите вслух.")).toBeVisible();
    await answer.fill("Сначала");
    await btn(page, "Надиктовать ответ").click();
    await expect(answer).toHaveValue("Сначала Назначу владельца данных");
  });

  test("sources: four tiles, photos of pages among them", async ({ page }) => {
    await mockApis(page);
    await onboard(page);
    await page.getByRole("navigation").getByRole("button", { name: "Навыки" }).click();
    await btn(page, /Новый навык/).click();
    await page.locator("#sk-name").fill("Маркетинг");
    await btn(page, /Создать и добавить источники/).click();
    await expect(page.locator(".source-tiles .action-tile")).toHaveCount(4);
    await expect(btn(page, /Фото страниц/)).toBeVisible();
    await expect(page.getByTestId("source-photo")).toHaveAttribute("accept", /image\/jpeg/);
  });
});
