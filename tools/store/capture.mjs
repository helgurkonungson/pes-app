// Raw app screenshots for the store listings, in every interface language.
// Usage: npm run build && npx vite preview --port 4175 &  node tools/store/capture.mjs <outDir> [langs] [devices]
// Drives the real web build with Playwright: onboarding → a free built-in course lesson → home with
// demo progress → courses → progress → a new skillset's sources screen. Demo progress (a 7-day streak)
// is written into the local database only for the screenshots.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.STORE_BASE_URL ?? "http://localhost:4175/";
const out = process.argv[2] ?? "store-shots";
const LANGS = (process.argv[3] ?? "en,es,de,fr,zh,hi,ru,uk,be").split(",");
const DEVICES = {
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  tablet: { viewport: { width: 820, height: 1180 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};
const DEV = (process.argv[4] ?? "phone,tablet").split(",");
const LABEL = { en: "English", es: "Español", de: "Deutsch", fr: "Français", zh: "中文", hi: "हिन्दी", ru: "Русский", uk: "Українська", be: "Беларуская" };
const NAME = { en: "Alex", es: "Lucía", de: "Jonas", fr: "Camille", zh: "李明", hi: "आरव", ru: "Анна", uk: "Олена", be: "Алесь" };
const SKILL = { en: "Marketing basics", es: "Marketing básico", de: "Marketing-Grundlagen", fr: "Bases du marketing", zh: "市场营销基础", hi: "मार्केटिंग की बुनियाद", ru: "Основы маркетинга", uk: "Основи маркетингу", be: "Асновы маркетынгу" };
const ANSWER = {
  en: "I will review the material the next day and test myself instead of rereading.",
  es: "Repasaré el material al día siguiente y me pondré a prueba en lugar de releer.",
  de: "Ich wiederhole den Stoff am nächsten Tag und teste mich, statt nur nachzulesen.",
  fr: "Je réviserai le lendemain et je me testerai au lieu de relire.",
  zh: "我会在第二天复习，并通过自测而不是重读来巩固。",
  hi: "मैं अगले दिन दोहराऊँगा और दोबारा पढ़ने के बजाय खुद को परखूँगा।",
  ru: "Повторю материал на следующий день и буду проверять себя, а не перечитывать.",
  uk: "Повторю матеріал наступного дня й перевірятиму себе замість перечитування.",
  be: "Паўтару матэрыял на наступны дзень і буду правяраць сябе замест перачытвання.",
};

const pause = (p, ms = 600) => p.waitForTimeout(ms);

async function correctIndex(page) {
  const q = (await page.locator(".q-title").first().innerText()).trim();
  return page.evaluate(async (qText) => {
    const db = await new Promise((r) => {
      const req = indexedDB.open("pes");
      req.onsuccess = () => r(req.result);
    });
    const all = await new Promise((r) => {
      const req = db.transaction("sessions").objectStore("sessions").getAll();
      req.onsuccess = () => r(req.result);
    });
    for (const s of all) {
      const qs = [...(s.lesson?.review?.questions ?? []), ...(s.lesson?.quiz ?? []), ...(s.placement?.questions ?? [])];
      const m = qs.find((x) => x.q.trim() === qText);
      if (m) return m.answer;
    }
    return 0;
  }, q);
}

async function seedProgress(page) {
  await page.evaluate(async () => {
    const pad = (n) => String(n).padStart(2, "0");
    const dayOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const db = await new Promise((r) => {
      const req = indexedDB.open("pes");
      req.onsuccess = () => r(req.result);
    });
    const tx = db.transaction(["activity", "profile"], "readwrite");
    const mins = [12, 18, 9, 15, 21, 11];
    for (let i = 1; i <= 6; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      tx.objectStore("activity").put({ day: dayOf(d), minutes: mins[i - 1], xp: 60 + mins[i - 1] * 4, sessions: 1, correct: 5, total: 6 });
    }
    const today = tx.objectStore("activity").get(dayOf(new Date()));
    today.onsuccess = () => tx.objectStore("activity").put({ ...(today.result ?? { day: dayOf(new Date()), xp: 70, sessions: 1, correct: 4, total: 4 }), minutes: 14 });
    const ps = tx.objectStore("profile");
    const req = ps.get("me");
    req.onsuccess = () => {
      const p = req.result;
      ps.put({ ...p, xp: (p.xp ?? 0) + 640, streak: { ...p.streak, current: 7, best: 7, lastDay: dayOf(new Date()) } });
    };
    await new Promise((r) => (tx.oncomplete = r));
  });
}

async function run(browser, lang, device) {
  const dir = `${out}/${device}/${lang}`;
  mkdirSync(dir, { recursive: true });
  const ctx = await browser.newContext({ ...DEVICES[device], colorScheme: "dark", locale: lang });
  const page = await ctx.newPage();
  await page.route("https://api.github.com/**", (r) => r.fulfill({ status: 404, body: "{}" }));
  const shot = async (n) => {
    await page.addStyleTag({ content: ".toast-host{display:none!important} *{caret-color:transparent!important}" });
    await pause(page, 700);
    await page.screenshot({ path: `${dir}/${n}.png` });
  };

  await page.goto(BASE);
  await page.locator(".lang-btn").click();
  await page.getByRole("dialog").getByRole("radio", { name: new RegExp(`^${LABEL[lang]}`) }).click();
  await page.getByRole("dialog").waitFor({ state: "detached" }).catch(() => undefined);
  await page.locator(".onb-actions .btn.primary").first().click();
  await page.locator("#name").fill(NAME[lang]);
  await page.locator(".onb-actions .btn.primary").first().click();
  await page.locator(".onb-actions .btn.dark").last().click();
  await page.locator(".tut-skip").click();
  await pause(page, 500);

  // a free course: lesson theory, a quiz question answered right, then finish the lesson
  await page.locator("nav.tabbar button").nth(1).click();
  await page.locator('[data-testid="builtin-courses"] button').first().click();
  await page.locator(".session-body").waitFor();
  await pause(page, 1200);
  await shot("3-lesson");
  let quizShot = false;
  for (let guard = 0; guard < 60; guard++) {
    if (await page.locator(".congrats").isVisible().catch(() => false)) break;
    const opt = page.locator(".option:not([disabled])");
    if (await opt.first().isVisible().catch(() => false)) {
      await opt.nth(await correctIndex(page)).click();
      if (!quizShot && (await page.locator(".q-title").count())) {
        await shot("4-quiz");
        quizShot = true;
      }
    }
    const ta = page.locator(".session-body textarea");
    if ((await ta.isVisible().catch(() => false)) && !(await ta.inputValue())) {
      await ta.fill(ANSWER[lang]);
      await page.locator(".session-body .btn.primary.block").first().click();
      const box = page.locator(".session-body .check-row input");
      if (await box.count()) await box.first().check();
      await page.locator(".session-body .btn.primary.block").last().click();
      await pause(page, 400);
    }
    const next = page.locator(".cta-bar .btn.primary");
    if (await next.isEnabled().catch(() => false)) await next.click();
    await pause(page, 250);
  }

  await seedProgress(page);
  await page.goto(BASE);
  await page.locator("nav.tabbar").waitFor();
  await shot("1-home");
  await page.locator("nav.tabbar button").nth(1).click();
  await page.locator('[data-testid="builtin-courses"]').scrollIntoViewIfNeeded();
  await shot("5-courses");
  await page.locator("nav.tabbar button").nth(2).click();
  await shot("6-progress");
  await page.locator("nav.tabbar button").nth(1).click();
  await page.locator(".action-tile").first().click();
  await page.locator("#sk-name").fill(SKILL[lang]);
  await page.locator(".btn.primary").last().click();
  await page.locator(".action-tile").first().waitFor();
  await shot("2-sources");
  await ctx.close();
}

const browser = await chromium.launch();
for (const device of DEV) for (const lang of LANGS) {
  try {
    await run(browser, lang, device);
    console.log("ok", device, lang);
  } catch (e) {
    console.log("FAIL", device, lang, String(e).split("\n").slice(0, 3).join(" | "));
  }
}
await browser.close();
