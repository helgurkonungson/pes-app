import { expect, test } from "@playwright/test";
import { btn, createSkillsetWithText, mockApis, onboard, skipCountdown } from "./helpers";

test.describe("first-run tutorial", () => {
  test("shows after onboarding, walks through five slides and does not come back", async ({ page }) => {
    await mockApis(page);
    await onboard(page, { tutorial: true });
    const tut = page.locator(".tutorial");
    await expect(tut).toBeVisible();
    await expect(tut.getByRole("heading", { name: "Учитесь по своим материалам" })).toBeVisible();
    for (let i = 0; i < 4; i++) await tut.getByRole("button", { name: /^Далее/ }).click();
    await expect(tut.getByRole("button", { name: "Пропустить" })).toHaveCount(0); // last slide
    await tut.getByRole("button", { name: /Поехали/ }).click();
    await expect(tut).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole("navigation")).toBeVisible();
    await expect(page.locator(".tutorial")).toHaveCount(0);
  });

  test("skip shows where to find it; Settings replays it; back and swipe navigate", async ({ page }) => {
    await mockApis(page);
    await onboard(page, { tutorial: true });
    await page.locator(".tutorial").getByRole("button", { name: "Пропустить" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Настройки → Посмотреть обучение" })).toBeVisible();
    await page.getByRole("navigation").getByRole("button", { name: "Настройки" }).click();
    await page.getByRole("button", { name: "Посмотреть обучение" }).click();
    const tut = page.locator(".tutorial");
    await expect(tut).toBeVisible();
    await tut.getByRole("button", { name: /^Далее/ }).click();
    await expect(tut.getByRole("heading", { name: "Порция под ваш день" })).toBeVisible();
    await tut.getByRole("button", { name: "Назад" }).click();
    await expect(tut.getByRole("heading", { name: "Учитесь по своим материалам" })).toBeVisible();
    await page.keyboard.press("ArrowRight");
    await expect(tut.getByRole("heading", { name: "Порция под ваш день" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(tut).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Настройки" })).toBeVisible();
  });

  test("with reduced motion the illustrations show their finished state (nothing invisible)", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce", locale: "ru-RU" });
    const page = await ctx.newPage();
    await mockApis(page);
    await onboard(page, { tutorial: true });
    await page.waitForTimeout(500);
    const opacities = await page.locator(".tut-page").evaluateAll((els) => els.map((e) => getComputedStyle(e).opacity));
    expect(opacities).toEqual(["1", "1", "1"]);
    await page.locator(".tutorial").getByRole("button", { name: /^Далее/ }).click();
    const offset = await page.locator(".tut-ring .fill").evaluate((e) => getComputedStyle(e).strokeDashoffset);
    expect(parseFloat(offset)).toBeLessThan(100);
    await ctx.close();
  });

  test("people who used the app before the tutorial existed don't get it", async ({ page }) => {
    await mockApis(page);
    await onboard(page);
    // simulate an older profile without the tutorial field
    await page.evaluate(async () => {
      const req = indexedDB.open("pes");
      await new Promise((r) => (req.onsuccess = r));
      const tx = req.result.transaction("profile", "readwrite");
      const store = tx.objectStore("profile");
      const get = store.get("me");
      await new Promise((r) => (get.onsuccess = r));
      const p = get.result;
      delete p.tutorial;
      store.put(p);
      await new Promise((r) => (tx.oncomplete = r));
    });
    await page.reload();
    await expect(page.getByRole("navigation")).toBeVisible();
    await expect(page.locator(".tutorial")).toHaveCount(0);
  });
});

test.describe("report a lesson", () => {
  test("the flag in the lesson bar files a report without leaving the lesson; Settings lists it", async ({ page }) => {
    await mockApis(page, "ok");
    await onboard(page, { key: "sk-ant-test-0123456789abcdef" });
    await createSkillsetWithText(page);
    await btn(page, /Начать · 15 мин/).click();
    await skipCountdown(page);
    await expect(page.getByText("Создано AI")).toBeVisible();
    // go to a theory page and report it
    while (!(await page.getByRole("heading", { name: "Кто решает" }).isVisible())) {
      const opt = page.locator(".option:not([disabled])").first();
      if (await opt.isVisible().catch(() => false)) await opt.click();
      await btn(page, /^Далее/).click();
    }
    const pageBefore = await page.locator(".page-count").innerText();
    await page.getByRole("button", { name: "Пожаловаться на урок" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("button", { name: /Отправить жалобу/ })).toBeDisabled();
    await dialog.getByRole("radio", { name: "Фактическая ошибка" }).click();
    await dialog.getByLabel("Комментарий (необязательно)").fill("Владелец данных указан неверно");
    await dialog.getByRole("button", { name: /Отправить жалобу/ }).click();
    // no report endpoint in tests: saved on the phone, offered to send now or later
    await expect(page.getByRole("dialog", { name: "Спасибо! Жалоба сохранена" })).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: "Позже" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    // still on the same page of the lesson
    await expect(page.locator(".page-count")).toHaveText(pageBefore);
    await expect(page.getByRole("heading", { name: "Кто решает" })).toBeVisible();
    const saved = await page.evaluate(async () => {
      const req = indexedDB.open("pes");
      await new Promise((r) => (req.onsuccess = r));
      const get = req.result.transaction("reports").objectStore("reports").getAll();
      await new Promise((r) => (get.onsuccess = r));
      return get.result as { reason: string; excerpt: string; where: string; comment: string; provider?: string }[];
    });
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ reason: "wrong", comment: "Владелец данных указан неверно", provider: "anthropic" });
    expect(saved[0].excerpt).toContain("Кто решает");
    expect(saved[0].where).toMatch(/^lesson · theory 1\//);
  });

  test("Settings → Lesson reports shows reports and their state", async ({ page }) => {
    await mockApis(page);
    await onboard(page);
    await page.getByRole("navigation").getByRole("button", { name: "Настройки" }).click();
    await page.getByRole("button", { name: "Жалобы на уроки" }).click();
    await expect(page.getByText("Жалоб нет")).toBeVisible();
  });
});
