import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow, mockApis, onboard, pickLang } from "./helpers";

/** Every interface language: the first screen, the main tabs and Settings render translated and fit 360 px. */
const LANGS: { name: string; lang: string; start: RegExp; settings: string }[] = [
  { name: "Українська", lang: "uk", start: /Почати/, settings: "Налаштування" },
  { name: "Беларуская", lang: "be", start: /Пачаць/, settings: "Налады" },
  { name: "Español", lang: "es", start: /Empezar/, settings: "Ajustes" },
  { name: "Deutsch", lang: "de", start: /Los geht/, settings: "Einstellungen" },
  { name: "Français", lang: "fr", start: /Commencer/, settings: "Réglages" },
  { name: "中文（简体）", lang: "zh", start: /开始/, settings: "设置" },
  { name: "हिन्दी", lang: "hi", start: /शुरू/, settings: "सेटिंग्स" },
];

test.describe("interface languages", () => {
  for (const l of LANGS) {
    test(`${l.lang}: onboarding, tabs and settings are translated and fit the screen`, async ({ page }) => {
      await mockApis(page);
      await page.goto("/");
      await pickLang(page, l.name);
      await expect(page.locator("html")).toHaveAttribute("lang", l.lang);
      await expect(page.getByRole("button", { name: l.start })).toBeVisible();
      await expectNoHorizontalOverflow(page, `${l.lang} onboarding`);
      await page.getByRole("button", { name: l.start }).click();
      await page.locator("#name").fill("Oleg");
      await page.locator(".onb-actions .btn.primary").click();
      await page.locator(".onb-actions .btn.dark").click(); // continue without AI
      // tutorial in this language, then skipped
      await expect(page.locator(".tutorial")).toBeVisible();
      for (let i = 0; i < 5; i++) {
        await expectNoHorizontalOverflow(page, `${l.lang} tutorial ${i + 1}`);
        await page.locator(".tut-actions .btn.primary").click();
      }
      // last step: the five free courses and "create my own" (with its pages) fit too
      await expect(page.locator(".tutorial [data-course]")).toHaveCount(5);
      await expectNoHorizontalOverflow(page, `${l.lang} tutorial start`);
      await page.getByTestId("tut-own").click();
      await expectNoHorizontalOverflow(page, `${l.lang} own skill`);
      await page.locator(".tut-actions .btn.primary").click();
      await expectNoHorizontalOverflow(page, `${l.lang} connect AI`);
      await page.getByTestId("own-free").click();
      await expectNoHorizontalOverflow(page, `${l.lang} free AI catches`);
      for (let i = 0; i < 3; i++) await page.locator(".tut-actions .btn.dark").click(); // up to the start step
      await page.locator(".tut-actions .btn.dark").click(); // back to slide 5, where "Skip" is
      await page.locator(".tut-skip").click();
      await expect(page.locator(".tutorial")).toHaveCount(0);
      const tabs = page.getByRole("navigation").getByRole("button");
      await expect(tabs).toHaveCount(4);
      for (let i = 0; i < 4; i++) {
        await tabs.nth(i).click();
        await expectNoHorizontalOverflow(page, `${l.lang} tab ${i}`);
      }
      await expect(page.getByRole("heading", { name: l.settings, exact: true })).toBeVisible();
      // survives a restart (dictionary chunk loaded before the first frame)
      await page.reload();
      await expect(page.locator("html")).toHaveAttribute("lang", l.lang);
      await expect(page.getByRole("navigation").getByRole("button", { name: l.settings })).toBeVisible();
    });
  }

  test("the lesson language of a new skillset follows the interface and can be any of ten", async ({ page }) => {
    await mockApis(page);
    await onboard(page, { lang: "en" });
    await page.getByRole("navigation").getByRole("button", { name: "Skillsets" }).click();
    await page.getByRole("button", { name: /New skillset/ }).first().click();
    const field = page.getByRole("button", { name: /^Lesson language: English/ });
    await expect(field).toBeVisible();
    await field.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("radio")).toHaveCount(10);
    await dialog.getByRole("radio", { name: "Deutsch" }).click();
    await expect(page.getByRole("button", { name: /^Lesson language: Deutsch/ })).toBeVisible();
  });
});
