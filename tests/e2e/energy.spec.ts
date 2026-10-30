import { expect, type Page, test } from "@playwright/test";
import { btn, createSkillsetWithText, expectNoHorizontalOverflow, finishLesson, mockApis, onboard, skipCountdown } from "./helpers";

const nav = (page: Page, name: string) => page.getByRole("navigation").getByRole("button", { name }).click();

/** Merges `patch` into the stored profile (IndexedDB "pes", table "profile", key "me") and reloads. */
async function patchProfile(page: Page, patch: Record<string, unknown>): Promise<void> {
  await page.evaluate(async (patch) => {
    const db: IDBDatabase = await new Promise((ok, err) => {
      const r = indexedDB.open("pes");
      r.onsuccess = () => ok(r.result);
      r.onerror = () => err(r.error);
    });
    await new Promise<void>((ok, err) => {
      const tx = db.transaction("profile", "readwrite");
      const store = tx.objectStore("profile");
      const get = store.get("me");
      get.onsuccess = () => store.put({ ...get.result, ...patch });
      tx.oncomplete = () => ok();
      tx.onerror = tx.onabort = () => err(tx.error);
    });
    db.close();
  }, patch);
  await page.reload();
}

const dayAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

test.describe("energy, freezes and rest days (ADR-029)", () => {
  test("a lesson earns energy; Progress shows it with freezes; rest days are picked in Settings", async ({ page }) => {
    await mockApis(page);
    await onboard(page);
    await createSkillsetWithText(page);
    await btn(page, /^Начать/).click();
    await skipCountdown(page);
    await finishLesson(page);
    await expect(page.getByText(/Энергия \+\d+/)).toBeVisible();
    await btn(page, "Закрыть").click();
    await btn(page, "Назад").click();
    await nav(page, "Главная");

    const chip = page.getByRole("button", { name: /^Энергия: \d+/ });
    await expect(chip).toBeVisible();
    expect(Number((await chip.innerText()).trim())).toBeGreaterThan(0);
    await expectNoHorizontalOverflow(page, "home with energy");

    await chip.click();
    await expect(page.getByRole("region", { name: "Энергия" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Еще \d+ энергии до заморозки/ })).toBeDisabled();
    await page.getByText("Как получить энергию").click();
    await expect(page.getByText(/Неделя без пропусков: \+15/)).toBeVisible();

    await nav(page, "Настройки");
    await page.getByRole("button", { name: /Выходные/ }).click();
    const pick = page.getByRole("group", { name: "Выходные" });
    await pick.getByRole("button", { name: /^сб/i }).click();
    await pick.getByRole("button", { name: /^вс/i }).click();
    await expect(pick.getByRole("button", { name: /^пн/i })).toBeDisabled();
    await btn(page, "Готово").click();
    await expect(page.getByRole("button", { name: /Выходные.*сб, вс/i })).toBeVisible();
  });

  test("a freeze covers a missed day; one missed day without a freeze can be won back with two lessons", async ({ page }) => {
    await mockApis(page);
    await onboard(page);
    await createSkillsetWithText(page);
    await btn(page, "Назад").click();

    // enough energy for one freeze, a 6-day streak that last counted the day before yesterday
    await patchProfile(page, { energy: 60, streak: { current: 6, best: 6, lastDay: dayAgo(2) } });
    await nav(page, "Главная");
    await expect(page.getByText(/Серия из 6 дней прервалась/)).toBeVisible();

    // the same day, but with a freeze bought in time: the streak survives
    await patchProfile(page, { streak: { current: 6, best: 6, lastDay: dayAgo(2) } });
    await nav(page, "Прогресс");
    await page.getByRole("button", { name: /Купить заморозку · 50/ }).click();
    await patchProfile(page, { streak: { current: 6, best: 6, lastDay: dayAgo(2) } });
    await nav(page, "Главная");
    await expect(page.getByText(/Заморозка сохранила серию: 1 пропущенный день/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Серия: 6 дней" })).toBeVisible();

    // no freeze left: miss a day again → two lessons today bring it back
    await patchProfile(page, { freezes: 0, streak: { current: 6, best: 6, lastDay: dayAgo(2) } });
    await expect(page.getByText(/Пройдите сегодня 2 урока/)).toBeVisible();
    for (const i of [1, 2]) {
      await btn(page, /^Начать/).click();
      await skipCountdown(page);
      await finishLesson(page);
      if (i === 2) await expect(page.getByText("Серия вернулась: 7 дней!")).toBeVisible();
      await btn(page, "Закрыть").click();
      if (i === 1) await expect(page.getByText("Еще один урок сегодня — и серия вернется.")).toBeVisible();
    }
    await expect(page.getByRole("button", { name: "Серия: 7 дней" })).toBeVisible();
  });
});
