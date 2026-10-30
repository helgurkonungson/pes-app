// Raw app screenshots for the store listings, in every interface language.
// Usage: npm run build && npx vite preview --port 4175 &  node tools/store/capture.mjs <outDir> [langs] [devices]
// Drives the real web build with Playwright: onboarding (with a demo AI key; the AI is mocked) → a free
// built-in course lesson whose open answer the AI checks → home with demo progress → courses → a new
// skillset's sources screen. Demo progress (a 7-day streak) is written into the local database only for
// the screenshots. Store order (tools/store/frames.mjs): 1-ai-check, 2-sources, 3-lesson, 4-quiz, 5-courses, 6-home.
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
  "en": "Last week I read an article about budgeting and forgot it in two days. I think storage failed: I never reviewed it. Next time I'll retell it the next day.",
  "ru": "На прошлой неделе прочитала статью о бюджете и через два дня все забыла. Думаю, сбой на этапе хранения: я ни разу не повторила. В следующий раз перескажу ее на следующий день.",
  "uk": "Минулого тижня прочитала статтю про бюджет і за два дні все забула. Думаю, збій на етапі зберігання: я жодного разу не повторила. Наступного разу перекажу її наступного дня.",
  "be": "На мінулым тыдні прачытаў артыкул пра бюджэт і праз два дні ўсё забыў. Думаю, збой на этапе захоўвання: я ні разу не паўтарыў. Наступным разам перакажу яго на наступны дзень.",
  "es": "La semana pasada leí un artículo sobre presupuestos y a los dos días lo olvidé. Creo que falló el almacenamiento: nunca lo repasé. La próxima vez lo resumiré al día siguiente.",
  "de": "Letzte Woche habe ich einen Artikel über Budgets gelesen und ihn nach zwei Tagen vergessen. Ich glaube, das Speichern hat versagt: Ich habe nie wiederholt. Nächstes Mal fasse ich ihn am nächsten Tag zusammen.",
  "fr": "La semaine dernière, j'ai lu un article sur le budget et je l'ai oublié en deux jours. Je pense que le stockage a échoué : je ne l'ai jamais révisé. La prochaine fois, je le résumerai le lendemain.",
  "zh": "上周我读了一篇关于预算的文章，两天后就忘了。我觉得是存储环节出了问题：我一次都没复习。下次我会在第二天复述一遍。",
  "hi": "पिछले हफ़्ते मैंने बजट पर एक लेख पढ़ा और दो दिन में भूल गया। मुझे लगता है कि संग्रहण में गड़बड़ हुई: मैंने एक बार भी दोहराया नहीं। अगली बार मैं अगले दिन उसे अपने शब्दों में दोहराऊँगा।"
};
// what the mocked AI says about that answer (screenshot 1: the AI-checked open answer)
const GRADE = {
  "en": {
    "score": 8,
    "verdict": "Good: a real example and a clear plan.",
    "strengths": [
      "You gave a concrete example from your own life",
      "You suggested what to change: retell it the next day"
    ],
    "gaps": [
      "Check encoding too: were you focused while reading? That's often where it fails"
    ],
    "modelAnswer": "I read an article while chatting and a day later remembered nothing. Encoding failed: I wasn't focused. Next time I'll read without my phone and retell the main idea at the end."
  },
  "ru": {
    "score": 8,
    "verdict": "Хорошо: живой пример и понятный план.",
    "strengths": [
      "Вы привели конкретный пример из своей жизни",
      "Предложили, что изменить, — пересказать на следующий день"
    ],
    "gaps": [
      "Проверьте и кодирование: были ли вы сосредоточены, когда читали? Часто сбой именно там"
    ],
    "modelAnswer": "Я читал статью, переписываясь с друзьями, и через день ничего не помнил. Сбой при кодировании: я не был сосредоточен. В следующий раз прочитаю без телефона и в конце перескажу главную мысль."
  },
  "uk": {
    "score": 8,
    "verdict": "Добре: живий приклад і зрозумілий план.",
    "strengths": [
      "Ви навели конкретний приклад зі свого життя",
      "Запропонували, що змінити, — переказати наступного дня"
    ],
    "gaps": [
      "Перевірте й кодування: чи були ви зосереджені, коли читали? Часто збій саме там"
    ],
    "modelAnswer": "Я читав статтю, листуючись із друзями, і за день нічого не пам'ятав. Збій під час кодування: я не був зосереджений. Наступного разу читатиму без телефона й наприкінці перекажу головну думку."
  },
  "be": {
    "score": 8,
    "verdict": "Добра: жывы прыклад і зразумелы план.",
    "strengths": [
      "Вы прывялі канкрэтны прыклад са свайго жыцця",
      "Прапанавалі, што змяніць, — пераказаць на наступны дзень"
    ],
    "gaps": [
      "Праверце і кадаванне: ці былі вы засяроджаныя, калі чыталі? Часта збой менавіта там"
    ],
    "modelAnswer": "Я чытаў артыкул, перапісваючыся з сябрамі, і праз дзень нічога не памятаў. Збой пры кадаванні: я не быў засяроджаны. Наступным разам прачытаю без тэлефона і ў канцы перакажу галоўную думку."
  },
  "es": {
    "score": 8,
    "verdict": "Bien: un ejemplo real y un plan claro.",
    "strengths": [
      "Diste un ejemplo concreto de tu vida",
      "Propusiste qué cambiar: resumirlo al día siguiente"
    ],
    "gaps": [
      "Revisa también la codificación: ¿estabas concentrada al leer? A menudo falla ahí"
    ],
    "modelAnswer": "Leí un artículo mientras chateaba y al día siguiente no recordaba nada. Falló la codificación: no estaba concentrado. La próxima vez leeré sin el móvil y al final contaré la idea principal."
  },
  "de": {
    "score": 8,
    "verdict": "Gut: ein echtes Beispiel und ein klarer Plan.",
    "strengths": [
      "Du nennst ein konkretes Beispiel aus deinem Leben",
      "Du schlägst vor, was du änderst: am nächsten Tag zusammenfassen"
    ],
    "gaps": [
      "Prüfe auch das Kodieren: Warst du beim Lesen konzentriert? Oft hakt es genau dort"
    ],
    "modelAnswer": "Ich habe beim Chatten einen Artikel gelesen und am nächsten Tag nichts mehr gewusst. Das Kodieren hat versagt: Ich war nicht konzentriert. Nächstes Mal lese ich ohne Handy und fasse am Ende die Kernidee zusammen."
  },
  "fr": {
    "score": 8,
    "verdict": "Bien : un exemple réel et un plan clair.",
    "strengths": [
      "Vous donnez un exemple concret tiré de votre vie",
      "Vous proposez quoi changer : le résumer le lendemain"
    ],
    "gaps": [
      "Vérifiez aussi l'encodage : étiez-vous concentré en lisant ? C'est souvent là que ça coince"
    ],
    "modelAnswer": "J'ai lu un article en discutant sur mon téléphone et le lendemain je ne me souvenais de rien. L'encodage a échoué : je n'étais pas concentré. La prochaine fois, je lirai sans téléphone et je résumerai l'idée principale à la fin."
  },
  "zh": {
    "score": 8,
    "verdict": "不错：例子真实，计划清楚。",
    "strengths": [
      "你举了一个自己生活中的具体例子",
      "你提出了改进办法：第二天复述"
    ],
    "gaps": [
      "也检查一下编码环节：阅读时你专心吗？问题常常出在这里"
    ],
    "modelAnswer": "我一边聊天一边读文章，第二天什么都不记得了。问题出在编码：我没有专心。下次我会放下手机阅读，并在最后复述主要观点。"
  },
  "hi": {
    "score": 8,
    "verdict": "अच्छा: असली उदाहरण और साफ़ योजना।",
    "strengths": [
      "आपने अपनी ज़िंदगी से ठोस उदाहरण दिया",
      "आपने बताया कि क्या बदलेंगे — अगले दिन दोहराना"
    ],
    "gaps": [
      "एन्कोडिंग भी जाँचें: पढ़ते समय क्या आपका ध्यान पूरा था? अक्सर गड़बड़ वहीं होती है"
    ],
    "modelAnswer": "मैंने चैट करते-करते एक लेख पढ़ा और अगले दिन कुछ याद नहीं था। एन्कोडिंग में गड़बड़ हुई: मेरा ध्यान नहीं था। अगली बार मैं फ़ोन के बिना पढ़ूँगा और अंत में मुख्य विचार दोहराऊँगा।"
  }
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
  // a mocked Claude API: accepts the demo key and grades the open answer (nothing leaves the machine)
  await page.route("https://api.anthropic.com/**", async (route) => {
    if (route.request().url().includes("/v1/models"))
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [{ id: "claude-sonnet-5-5", display_name: "Claude Sonnet 5.5" }] }) });
    const body = JSON.parse(route.request().postData() ?? "{}");
    const tool = body.tool_choice?.name ?? "grade_answer";
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ id: "msg_1", model: "claude-sonnet-5-5", stop_reason: "tool_use", usage: { input_tokens: 900, output_tokens: 220 }, content: [{ type: "tool_use", id: "tu_1", name: tool, input: GRADE[lang] }] }),
    });
  });
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
  await page.locator("#key").fill("sk-ant-demo-0123456789abcdef");
  await page.locator(".onb-actions .btn.primary").first().click();
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
      await page.locator(".session-body .btn.primary.block").first().click(); // Check with AI
      await page.locator(".session-body .score-ring").waitFor();
      await page.evaluate(() => document.querySelectorAll("*").forEach((el) => el.scrollTop && (el.scrollTop = 0)));
      await shot("1-ai-check");
    }
    const next = page.locator(".cta-bar .btn.primary");
    if (await next.isEnabled().catch(() => false)) await next.click();
    await pause(page, 250);
  }

  await seedProgress(page);
  await page.goto(BASE);
  await page.locator("nav.tabbar").waitFor();
  await shot("6-home");
  await page.locator("nav.tabbar button").nth(1).click();
  await page.locator('[data-testid="builtin-courses"]').scrollIntoViewIfNeeded();
  await shot("5-courses");
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
