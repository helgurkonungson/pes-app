import { expect, type Page, test } from "@playwright/test";
import { btn, compatRequest, createSkillsetWithText, mockApis, onboard, skipCountdown, toolInput } from "./helpers";

/** Chompbook Pro (ADR-037). The web build can't buy (Google Play only), so an active Pro is set up directly. */

const RC_ID = "$RCAnonymousID:0123456789abcdef0123456789abcdef";

/** Marks Pro as active the way the store sync would: the Pro "key" in secure storage + profile fields. */
async function activatePro(page: Page): Promise<void> {
  await page.evaluate(async (id) => {
    localStorage.setItem("capacitor-storage_chompbook_api_key", id);
    await new Promise<void>((resolve, reject) => {
      const open = indexedDB.open("pes");
      open.onsuccess = () => {
        const tx = open.result.transaction("profile", "readwrite");
        const store = tx.objectStore("profile");
        const get = store.get("me");
        get.onsuccess = () => store.put({ ...get.result, ageGroup: "adult", provider: "chompbook", aiBlock: undefined, pro: { active: true, since: "2026-10-29T10:00:00Z", until: "2026-11-29T10:00:00Z" } });
        tx.oncomplete = () => {
          open.result.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
      open.onerror = () => reject(open.error);
    });
  }, RC_ID);
  await page.reload();
  await expect(page.getByRole("navigation")).toBeVisible();
}

type ProMode = "ok" | "inactive" | "daily";

async function mockPro(page: Page, mode: ProMode = "ok"): Promise<{ auth: string[]; audience: string[]; chats: number }> {
  const seen = { auth: [] as string[], audience: [] as string[], chats: 0 };
  await page.route("https://api.chompbook.online/**", async (route) => {
    const req = route.request();
    seen.auth.push(req.headers()["authorization"] ?? "");
    const url = req.url();
    if (mode === "inactive") return route.fulfill({ status: 402, contentType: "application/json", body: JSON.stringify({ error: { code: "no_subscription", message: "Your Chompbook Pro subscription is not active (payment required)." } }) });
    if (url.endsWith("/usage")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ limit: 600000, used: 120000, left: 480000, resetAt: "2026-10-30T00:00:00.000Z" }) });
    if (url.endsWith("/models")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [{ id: "chompbook" }] }) });
    seen.chats++;
    seen.audience.push(req.headers()["x-chompbook-audience"] ?? "");
    if (mode === "daily") return route.fulfill({ status: 429, contentType: "application/json", body: JSON.stringify({ error: { code: "daily_limit", message: "Today's Chompbook AI limit is used up (per day, about 10 lessons). It resets at 00:00 UTC." } }) });
    const { tool, prompt } = compatRequest(JSON.parse(req.postData() ?? "{}"));
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ choices: [{ message: { tool_calls: [{ function: { name: tool, arguments: JSON.stringify(toolInput(tool, prompt)) } }] } }], usage: { prompt_tokens: 900, completion_tokens: 300 } }),
    });
  });
  return seen;
}

test.describe("Chompbook Pro", () => {
  test("not sold outside Google Play: Settings shows it isn't active and where to get it", async ({ page }) => {
    await mockApis(page);
    await onboard(page);
    await page.getByRole("navigation").getByRole("button", { name: "Настройки" }).click();
    const row = page.locator(".menu-row", { hasText: "Chompbook Pro" });
    await expect(row).toContainText("Не оформлена");
    await row.click();
    await expect(page.getByRole("heading", { name: "Chompbook Pro" })).toBeVisible();
    await expect(page.getByText("Около 10 ИИ-уроков в день")).toBeVisible();
    await expect(page.getByTestId("pro-play-only")).toContainText("Google Play");
    await expect(btn(page, "Открыть в Google Play")).toBeVisible();
  });

  test("active Pro: lessons are written by Chompbook AI with the Pro id, no key or model to set, today's allowance shown", async ({ page }) => {
    await mockApis(page, "credits"); // Claude would fail — proves the lesson comes from Chompbook AI
    const pro = await mockPro(page);
    await onboard(page);
    await activatePro(page);
    await page.getByRole("navigation").getByRole("button", { name: "Настройки" }).click();
    await expect(page.locator(".menu-row", { hasText: "Chompbook Pro" })).toContainText("Активна");
    await expect(page.locator(".menu-row", { hasText: "Провайдер ИИ" })).toContainText("Chompbook AI");
    await expect(page.locator(".menu-row", { hasText: "Модель" })).toHaveCount(0);
    await page.locator(".menu-row", { hasText: "Chompbook Pro" }).click();
    await expect(page.getByTestId("pro-active")).toContainText("У вас Chompbook Pro");
    await expect(page.getByText("осталось около 8 уроков").first()).toBeVisible();
    await expect(page.getByText("Уроки идут на Chompbook AI")).toBeVisible();
    await btn(page, "Назад").click();
    await createSkillsetWithText(page);
    await btn(page, /Начать · 15 мин/).click();
    await skipCountdown(page);
    await expect(page.getByRole("heading", { name: "Кто решает" })).toBeVisible();
    expect(pro.chats).toBeGreaterThan(0);
    expect(pro.auth.every((a) => a === `Bearer ${RC_ID}`)).toBe(true);
    // the server adds teen safety rules unless the learner is an adult (ADR-037)
    expect(pro.audience.every((a) => a === "adult")).toBe(true);
  });

  test("Pro lapsed: the lesson is built without AI and the app says to renew Pro (not to top up credits)", async ({ page }) => {
    await mockApis(page, "credits");
    await mockPro(page, "inactive");
    await onboard(page);
    await activatePro(page);
    await createSkillsetWithText(page);
    await btn(page, /Начать · 15 мин/).click();
    await skipCountdown(page);
    await expect(page.getByText("Chompbook Pro не активна, поэтому этот урок собран из вашего источника без ИИ.")).toBeVisible();
  });

  test("daily allowance used up: says so and offers to study without AI", async ({ page }) => {
    await mockApis(page, "credits");
    await mockPro(page, "daily");
    await onboard(page);
    await activatePro(page);
    await createSkillsetWithText(page);
    await btn(page, /Начать · 15 мин/).click();
    await expect(page.getByRole("alert")).toContainText("Дневной лимит Chompbook AI исчерпан", { timeout: 20_000 });
    await btn(page, "Заниматься без ИИ").click();
    await skipCountdown(page);
    await expect(page.getByText(/Чтение · часть 1 из/)).toBeVisible();
  });
});
