import { expect, test } from "@playwright/test";
import { btn, createSkillsetWithText, finishLesson, mockApis, onboard, skipCountdown } from "./helpers";

test.describe("progress survives restarts and updates", () => {
  test("data stays after an app restart (same origin, as after an APK update)", async ({ page }) => {
    await mockApis(page);
    await onboard(page);
    await createSkillsetWithText(page);
    await btn(page, /Начать · 15 мин/).click();
    await skipCountdown(page);
    await finishLesson(page);
    await page.reload();
    await expect(page.getByRole("navigation")).toBeVisible();
    await expect(page.locator(".next-title")).toHaveText("Урок 2");
    await expect(page.getByRole("button", { name: /Серия: 1 день/ })).toBeVisible();
  });

  test("if the database is lost, the automatic snapshot restores it", async ({ page }) => {
    await mockApis(page);
    await onboard(page);
    await createSkillsetWithText(page);
    await btn(page, /Начать · 15 мин/).click();
    await skipCountdown(page);
    await finishLesson(page); // writes the snapshot
    await page.waitForTimeout(1500);
    // simulate an update that lost IndexedDB "pes" (the snapshot lives in the app's files)
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          indexedDB.deleteDatabase("pes").onsuccess = () => resolve();
          setTimeout(resolve, 3000);
        }),
    );
    await page.reload();
    await expect(page.getByText("Прогресс восстановлен из автоматической копии")).toBeVisible();
    await expect(page.locator(".next-title")).toHaveText("Урок 2");
  });

  test("backup file: export, wipe, restore from onboarding", async ({ page }) => {
    await mockApis(page);
    await onboard(page);
    await createSkillsetWithText(page, "Навык для копии");
    await btn(page, "Назад").click();
    await page.getByRole("navigation").getByRole("button", { name: "Настройки" }).click();
    const download = page.waitForEvent("download");
    await btn(page, /Сохранить резервную копию/).click();
    const file = await (await download).path();
    await btn(page, /Удалить все данные/).click();
    await page.getByRole("dialog").getByRole("button", { name: "Удалить все" }).click();
    await expect(page.getByRole("heading", { name: /Учитесь чему угодно/ })).toBeVisible();
    await page.setInputFiles('[data-testid="backup-file"]', file!);
    await page.getByRole("dialog").getByRole("button", { name: "Восстановить" }).click();
    await expect(page.getByRole("navigation")).toBeVisible();
    await page.getByRole("navigation").getByRole("button", { name: "Навыки" }).click();
    await expect(page.getByText("Навык для копии")).toBeVisible();
  });
});
