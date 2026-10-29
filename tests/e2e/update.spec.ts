import { expect, test } from "@playwright/test";
import { btn, createSkillsetWithText, mockApis, onboard, skipCountdown } from "./helpers";

const release = (tag: string) => ({
  tag_name: tag,
  body: "notes",
  html_url: `https://github.com/helgurkonungson/pes-app/releases/tag/${tag}`,
  published_at: "2026-10-23T18:00:00Z",
  assets: [{ name: `PES-${tag.slice(1)}.apk`, browser_download_url: `https://github.com/x/PES-${tag.slice(1)}.apk` }],
});

// The GitHub self-updater exists only in builds made with VITE_SELF_UPDATE=1; the switch below turns it on for these tests.
test.beforeEach(async ({ page }, info) => {
  if (!info.title.startsWith("Google Play build")) await page.addInitScript(() => localStorage.setItem("pes.selfUpdate", "1"));
});

test("Google Play build: no update check at all — Settings shows the version and points to Google Play", async ({ page }) => {
  let githubCalls = 0;
  await mockApis(page);
  await page.route("https://api.github.com/**", (r) => {
    githubCalls++;
    return r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(release("v9.9.9")) });
  });
  await page.addInitScript(() => localStorage.setItem("pes.autoUpdateCheck", "1")); // even the dev switch can't turn it on
  await onboard(page);
  await page.getByRole("navigation").getByRole("button", { name: "Настройки" }).click();
  await expect(page.getByRole("button", { name: /Проверить обновления/ })).toHaveCount(0);
  await expect(page.locator(".menu-row", { hasText: "Версия" })).toContainText("Обновления приходят через Google Play");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(githubCalls).toBe(0);
});

test.describe("check for updates", () => {
  test("no newer release → says so right in the row", async ({ page }) => {
    await mockApis(page);
    await page.route("https://api.github.com/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(release("v0.0.1")) }));
    await onboard(page);
    await page.getByRole("navigation").getByRole("button", { name: "Настройки" }).click();
    await btn(page, /Проверить обновления/).click();
    await expect(page.locator(".menu-row", { hasText: "Проверить обновления" })).toContainText(/У вас последняя версия · проверено в \d/);
  });

  test("newer release → install row appears", async ({ page }) => {
    await mockApis(page);
    await page.route("https://api.github.com/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(release("v9.9.9")) }));
    await onboard(page);
    await page.getByRole("navigation").getByRole("button", { name: "Настройки" }).click();
    await btn(page, /Проверить обновления/).click();
    await expect(page.locator(".menu-row", { hasText: "Проверить обновления" })).toContainText("Доступна версия 9.9.9");
    await expect(btn(page, /Установить 9\.9\.9/)).toBeVisible();
  });

  test("GitHub unreachable → visible error", async ({ page }) => {
    await mockApis(page);
    await page.route("https://api.github.com/**", (r) => r.abort("internetdisconnected"));
    await onboard(page);
    await page.getByRole("navigation").getByRole("button", { name: "Настройки" }).click();
    await btn(page, /Проверить обновления/).click();
    await expect(page.locator(".menu-row", { hasText: "Проверить обновления" })).toContainText("Не удалось связаться с GitHub");
  });
});

test.describe("daily update pop-up", () => {
  const NOTES = "- **Faster lessons** with Gemini.\n- New icon.";
  const withNotes = (tag: string) => ({ ...release(tag), body: NOTES });

  test.beforeEach(async ({ page }) => {
    // the daily check runs only in the Android app; this switch turns it on in the browser
    await page.addInitScript(() => localStorage.setItem("pes.autoUpdateCheck", "1"));
  });

  test("first launch of the day → pop-up; later launches that day → banner only, no new request; next day → asks again", async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-10-24T09:00:00"));
    await mockApis(page);
    let checks = 0;
    await page.route("https://api.github.com/**", (r) => {
      checks++;
      return r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(withNotes("v9.9.9")) });
    });
    await onboard(page);
    const popup = page.getByRole("dialog", { name: "Доступна новая версия" });
    await expect(popup).toBeVisible();
    await expect(popup).toContainText("Версия 9.9.9 готова к установке");
    await expect(popup).toContainText("Что нового");
    await expect(popup).toContainText("Faster lessons");
    await popup.getByRole("button", { name: "Позже" }).click();
    await expect(popup).toBeHidden();
    await expect(page.getByText("Готово обновление 9.9.9")).toBeVisible();

    await page.reload();
    await expect(page.getByText("Готово обновление 9.9.9")).toBeVisible();
    await expect(popup).toBeHidden();
    expect(checks).toBe(1);

    await page.clock.setFixedTime(new Date("2026-10-25T07:30:00"));
    await page.reload();
    await expect(popup).toBeVisible();
    expect(checks).toBe(2);
  });

  test("no newer version → no pop-up and no banner", async ({ page }) => {
    await mockApis(page);
    let checks = 0;
    await page.route("https://api.github.com/**", (r) => {
      checks++;
      return r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(release("v0.0.1")) });
    });
    await onboard(page);
    await expect.poll(() => checks).toBe(1);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByText(/Готово обновление/)).toHaveCount(0);
  });

  test("GitHub unreachable → nothing shown, and the next launch tries again", async ({ page }) => {
    await mockApis(page);
    let checks = 0;
    let online = false;
    await page.route("https://api.github.com/**", (r) => {
      checks++;
      return online ? r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(release("v9.9.9")) }) : r.abort("internetdisconnected");
    });
    await onboard(page);
    await expect.poll(() => checks).toBe(1);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    online = true;
    await page.reload();
    await expect(page.getByRole("dialog", { name: "Доступна новая версия" })).toBeVisible();
    expect(checks).toBe(2);
  });

  test("Update → the download opens and the pop-up closes", async ({ page }) => {
    await mockApis(page);
    await page.route("https://api.github.com/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(release("v9.9.9")) }));
    await page.context().route("https://github.com/**", (r) => r.fulfill({ status: 200, body: "apk" }));
    await onboard(page);
    const popup = page.getByRole("dialog", { name: "Доступна новая версия" });
    await expect(popup).toBeVisible();
    const download = page.waitForEvent("popup");
    await popup.getByRole("button", { name: "Обновить" }).click();
    expect((await download).url()).toBe("https://github.com/x/PES-9.9.9.apk");
    await expect(popup).toBeHidden();
  });

  test("the pop-up never interrupts a lesson: it waits until the lesson is closed", async ({ page }) => {
    await mockApis(page);
    // GitHub answers late — only once the learner is already inside a lesson
    let answer: () => void = () => undefined;
    const late = new Promise<void>((ok) => (answer = ok));
    await page.route("https://api.github.com/**", async (r) => {
      await late;
      return r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(release("v9.9.9")) });
    });
    await onboard(page);
    await createSkillsetWithText(page);
    await btn(page, /Начать · 15 мин/).click();
    await skipCountdown(page);
    answer();
    await page.waitForTimeout(800);
    await expect(page.getByRole("dialog", { name: "Доступна новая версия" })).toHaveCount(0);
    await expect(page.locator(".session-body")).toBeVisible();
    await page.getByRole("button", { name: "Выйти из урока" }).click();
    await page.getByRole("dialog", { name: "Выйти из урока?" }).getByRole("button", { name: "Выйти" }).click();
    await expect(page.getByRole("dialog", { name: "Доступна новая версия" })).toBeVisible();
  });
});
