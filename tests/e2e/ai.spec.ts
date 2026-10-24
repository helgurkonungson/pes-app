import { expect, test } from "@playwright/test";
import { btn, chooseProvider, createSkillsetWithText, finishLesson, mockApis, onboard, skipCountdown } from "./helpers";

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

  test("new skillset: “Continue without sources” goes straight to the first (AI) session", async ({ page }) => {
    await mockApis(page, "ok");
    await onboard(page, { key: "sk-ant-test-0123456789abcdef" });
    await page.getByRole("navigation").getByRole("button", { name: "Навыки" }).click();
    await btn(page, /Новый навык/).click();
    await page.locator("#sk-name").fill("Переговоры");
    await btn(page, /Создать и добавить источники/).click();
    await expect(page.getByText("Источники можно будет добавить позднее.")).toBeVisible();
    await btn(page, /Продолжить без источников/).click();
    await skipCountdown(page);
    await expect(page.getByRole("heading", { name: "Определим ваш стартовый уровень" })).toBeVisible();
    // closing the session lands on the skillset, not back on the sources screen
    await page.getByRole("button", { name: "Выйти из урока" }).click();
    await page.getByRole("button", { name: "Выйти", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Переговоры" })).toBeVisible();
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
      const { compatRequest, toolInput } = await import("./helpers");
      const { tool, prompt } = compatRequest(body);
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ choices: [{ message: { tool_calls: [{ function: { name: tool, arguments: JSON.stringify(toolInput(tool, prompt)) } }] } }] }),
      });
    });
    await onboard(page);
    await page.getByRole("navigation").getByRole("button", { name: "Настройки" }).click();
    await chooseProvider(page, "ChatGPT");
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
    await chooseProvider(page, "Алиса AI");
    await expect(page.getByText("ID каталога Yandex Cloud")).toBeVisible();
    await btn(page, /Ключ API Алиса AI/).click();
    await page.getByRole("dialog").getByRole("textbox").fill("AQVN-test-0123456789abcdef");
    await page.getByRole("dialog").getByRole("button", { name: "Проверить и сохранить" }).click();
    await expect(page.getByRole("alert")).toContainText("Сначала укажите ID каталога");
  });
});

test("NVIDIA key → lesson from a JSON text answer", async ({ page }) => {
  await mockApis(page, "credits");
  const calls: string[] = [];
  await page.route("https://integrate.api.nvidia.com/**", async (route) => {
    const url = route.request().url();
    calls.push(url);
    if (url.endsWith("/models")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [{ id: "meta/llama-3.3-70b-instruct" }, { id: "nvidia/nv-embedqa-e5-v5" }] }) });
    const { compatRequest, toolInput } = await import("./helpers");
    const { tool, prompt } = compatRequest(JSON.parse(route.request().postData() ?? "{}"));
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ choices: [{ message: { content: "Вот ответ:\n```json\n" + JSON.stringify(toolInput(tool, prompt)) + "\n```" } }] }) });
  });
  await onboard(page);
  await page.getByRole("navigation").getByRole("button", { name: "Настройки" }).click();
  await chooseProvider(page, "NVIDIA");
  await btn(page, /Ключ API NVIDIA/).click();
  await page.getByRole("dialog").getByRole("textbox").fill("nvapi-test-0123456789abcdef");
  await page.getByRole("dialog").getByRole("button", { name: "Проверить и сохранить" }).click();
  await expect(page.getByText("Ключ сохранён")).toBeVisible();
  await expect(page.locator(".menu-row", { hasText: "Модель" })).toContainText("meta/llama-3.3-70b-instruct");
  await createSkillsetWithText(page);
  await btn(page, "Пропустить").click();
  await btn(page, /Начать · 15 мин/).click();
  await skipCountdown(page);
  await expect(page.getByText("Коротко о прошлом уроке")).toBeVisible();
  expect(calls.some((c) => c.endsWith("/chat/completions"))).toBe(true);
});

test("Alice AI: a valid key without folder rights explains how to fix it", async ({ page }) => {
  await mockApis(page);
  await page.route("https://llm.api.cloud.yandex.net/**", (r) =>
    r.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify({ error: { message: "rpc error: code = PermissionDenied desc = Permission to [resource-manager.folder b1gtest] denied", type: "permission_error" } }) }),
  );
  await onboard(page);
  await page.getByRole("navigation").getByRole("button", { name: "Настройки" }).click();
  await chooseProvider(page, "Алиса AI");
  await btn(page, /ID каталога Yandex Cloud/).click();
  await page.getByRole("dialog").getByRole("textbox").fill("b1gtest");
  await page.getByRole("dialog").getByRole("button", { name: "Сохранить" }).click();
  await btn(page, /Ключ API Алиса AI/).click();
  await page.getByRole("dialog").getByRole("textbox").fill("AQVN-test-0123456789abcdef");
  await page.getByRole("dialog").getByRole("button", { name: "Проверить и сохранить" }).click();
  await expect(page.getByRole("alert")).toContainText("нет прав на этот каталог");
  await expect(page.getByRole("alert")).toContainText("ai.languageModels.user");
});

test.describe("Gemini, Groq and a custom server", () => {
  const lessonReply = async (route: import("@playwright/test").Route, asText = false) => {
    const { compatRequest, toolInput } = await import("./helpers");
    const { tool, prompt } = compatRequest(JSON.parse(route.request().postData() ?? "{}"));
    const input = JSON.stringify(toolInput(tool, prompt));
    const message = asText ? { content: input } : { tool_calls: [{ function: { name: tool, arguments: input } }] };
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ choices: [{ message }] }) });
  };

  async function lessonWorks(page: import("@playwright/test").Page) {
    await createSkillsetWithText(page);
    await btn(page, "Пропустить").click();
    await btn(page, /Начать · 15 мин/).click();
    await skipCountdown(page);
    await expect(page.getByText("Коротко о прошлом уроке")).toBeVisible();
  }

  test("Gemini: key → newest Flash model picked → lesson", async ({ page }) => {
    await mockApis(page, "credits");
    await page.route("https://generativelanguage.googleapis.com/**", async (route) => {
      const url = route.request().url();
      if (url.endsWith("/models"))
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [{ id: "models/gemini-2.5-flash" }, { id: "models/gemini-3.8-flash" }, { id: "models/gemini-3.8-flash-lite" }, { id: "models/gemini-embedding-001" }] }) });
      expect(route.request().headers()["authorization"]).toBe("Bearer AIza-test-0123456789abcdef");
      return lessonReply(route, true);
    });
    await onboard(page);
    await page.getByRole("navigation").getByRole("button", { name: "Настройки" }).click();
    await chooseProvider(page, "Gemini");
    await btn(page, /Ключ API Gemini/).click();
    await page.getByRole("dialog").getByRole("textbox").fill("AIza-test-0123456789abcdef");
    await page.getByRole("dialog").getByRole("button", { name: "Проверить и сохранить" }).click();
    await expect(page.getByText("Ключ сохранён")).toBeVisible();
    await expect(page.locator(".menu-row", { hasText: "Модель" })).toContainText("gemini-3.8-flash");
    await lessonWorks(page);
  });

  test("Gemini overloaded: retries, then Google's own words + a hint; Retry then works", async ({ page }) => {
    test.setTimeout(90_000);
    await mockApis(page, "credits");
    let calls = 0;
    let effort: unknown;
    await page.route("https://generativelanguage.googleapis.com/**", async (route) => {
      const url = route.request().url();
      if (url.endsWith("/models")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [{ id: "models/gemini-3.8-flash" }] }) });
      calls++;
      const body = JSON.parse(route.request().postData() ?? "{}");
      if (calls === 1) effort = body.reasoning_effort;
      // 3 tries with tools + 3 tries without, all "overloaded" (Gemini wraps errors in an array)
      if (calls <= 6)
        return route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify([{ error: { code: 503, message: "The model is overloaded. Please try again later.", status: "UNAVAILABLE" } }]) });
      return lessonReply(route, !body.tools);
    });
    await onboard(page);
    await page.getByRole("navigation").getByRole("button", { name: "Настройки" }).click();
    await chooseProvider(page, "Gemini");
    await btn(page, /Ключ API Gemini/).click();
    await page.getByRole("dialog").getByRole("textbox").fill("AIza-test-0123456789abcdef");
    await page.getByRole("dialog").getByRole("button", { name: "Проверить и сохранить" }).click();
    await expect(page.getByText("Ключ сохранён")).toBeVisible();
    await createSkillsetWithText(page);
    await btn(page, "Пропустить").click();
    await btn(page, /Начать · 15 мин/).click();
    await expect(page.getByRole("alert")).toContainText("перегружен", { timeout: 40_000 });
    await expect(page.getByRole("alert")).toContainText("(503)");
    await expect(page.getByText("Ответ сервиса: The model is overloaded. Please try again later. UNAVAILABLE")).toBeVisible();
    await expect(page.getByText(/выберите другую модель/)).toBeVisible();
    expect(calls).toBe(6);
    expect(effort).toBe("low");
    await btn(page, "Повторить").click();
    await skipCountdown(page);
    await expect(page.getByText("Коротко о прошлом уроке")).toBeVisible();
  });

  async function geminiReady(page: import("@playwright/test").Page) {
    await onboard(page);
    await page.getByRole("navigation").getByRole("button", { name: "Настройки" }).click();
    await chooseProvider(page, "Gemini");
    await btn(page, /Ключ API Gemini/).click();
    await page.getByRole("dialog").getByRole("textbox").fill("AIza-test-0123456789abcdef");
    await page.getByRole("dialog").getByRole("button", { name: "Проверить и сохранить" }).click();
    await expect(page.getByText("Ключ сохранён")).toBeVisible();
    await createSkillsetWithText(page);
    await btn(page, "Пропустить").click();
  }

  test("the lesson opens as soon as part 1 is written; the rest arrives in the background", async ({ page }) => {
    test.setTimeout(90_000);
    await mockApis(page, "credits");
    let releaseQuiz!: () => void;
    const quizGate = new Promise<void>((r) => (releaseQuiz = r));
    const tools: string[] = [];
    await page.route("https://generativelanguage.googleapis.com/**", async (route) => {
      const url = route.request().url();
      if (url.endsWith("/models")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [{ id: "models/gemini-3.8-flash" }] }) });
      const { compatRequest } = await import("./helpers");
      const { tool } = compatRequest(JSON.parse(route.request().postData() ?? "{}"));
      tools.push(tool);
      if (tool === "emit_quiz") await quizGate; // the quiz takes "a long time"
      return lessonReply(route);
    });
    await geminiReady(page);
    await btn(page, /Начать · 15 мин/).click();
    await skipCountdown(page); // started before the quiz exists
    await expect(page.locator(".build-strip")).toContainText("Урок дописывается");
    // walk to the end of what is written: a page that waits for the quiz
    for (let i = 0; i < 10 && !(await page.getByText("Составляю тест…").isVisible()); i++) {
      const option = page.locator(".option:not([disabled])").first();
      if (await option.isVisible().catch(() => false)) await option.click();
      await page.getByRole("button", { name: /^Далее/ }).click();
    }
    await expect(page.locator(".pending-page")).toContainText("Составляю тест…");
    await expect(page.getByRole("button", { name: /^Далее/ })).toBeDisabled();
    releaseQuiz();
    // the quiz appears on the same page by itself
    await expect(page.locator(".option").first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(".build-strip")).toHaveCount(0);
    await finishLesson(page);
  });

  test("background writing that stopped (phone asleep) continues from the saved steps when you come back", async ({ page }) => {
    test.setTimeout(90_000);
    await page.addInitScript(() => {
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => (window as unknown as { __vis?: string }).__vis ?? "visible" });
    });
    const setVis = (v: "hidden" | "visible") =>
      page.evaluate((v) => {
        (window as unknown as { __vis?: string }).__vis = v;
        document.dispatchEvent(new Event("visibilitychange"));
      }, v);
    await mockApis(page, "credits");
    const tools: string[] = [];
    let cut = false;
    await page.route("https://generativelanguage.googleapis.com/**", async (route) => {
      const url = route.request().url();
      if (url.endsWith("/models")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [{ id: "models/gemini-3.8-flash" }] }) });
      const { compatRequest } = await import("./helpers");
      const { tool, prompt } = compatRequest(JSON.parse(route.request().postData() ?? "{}"));
      tools.push(tool);
      if (tool === "emit_section" && prompt.includes("SECTION 2 of") && !cut) {
        cut = true;
        await setVis("hidden"); // the phone falls asleep while part 2 is being written…
        return route.abort("connectionreset"); // …and the connection drops
      }
      return lessonReply(route);
    });
    await geminiReady(page);
    await btn(page, /Начать · 15 мин/).click();
    await skipCountdown(page);
    await expect(page.locator(".build-strip")).toContainText("на паузе");
    await setVis("visible"); // the learner comes back
    await expect(page.locator(".build-strip")).toHaveCount(0, { timeout: 15_000 });
    // nothing was written twice
    expect(tools).toEqual(["emit_plan", "emit_review", "emit_section", "emit_section", "emit_section", "emit_quiz"]);
    await finishLesson(page);
  });

  test("a step that failed before the lesson could open keeps the finished ones: Retry continues", async ({ page }) => {
    await mockApis(page, "credits");
    const tools: string[] = [];
    let failSection = true;
    await page.route("https://generativelanguage.googleapis.com/**", async (route) => {
      const url = route.request().url();
      if (url.endsWith("/models")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [{ id: "models/gemini-3.8-flash" }] }) });
      const { compatRequest } = await import("./helpers");
      const { tool } = compatRequest(JSON.parse(route.request().postData() ?? "{}"));
      tools.push(tool);
      if (tool === "emit_section" && failSection) return route.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify([{ error: { code: 400, message: "Request contains an invalid argument.", status: "INVALID_ARGUMENT" } }]) });
      return lessonReply(route);
    });
    await geminiReady(page);
    await btn(page, /Начать · 15 мин/).click();
    await expect(page.getByRole("alert")).toBeVisible();
    const before = tools.length;
    failSection = false;
    await btn(page, "Повторить").click();
    await skipCountdown(page);
    await expect(page.getByText("Коротко о прошлом уроке")).toBeVisible();
    await expect(page.locator(".build-strip")).toHaveCount(0, { timeout: 15_000 });
    expect(tools.slice(before)).toEqual(["emit_section", "emit_section", "emit_quiz"]);
  });

  test("Groq: forced function call → lesson", async ({ page }) => {
    await mockApis(page, "credits");
    let forced = false;
    await page.route("https://api.groq.com/**", async (route) => {
      const url = route.request().url();
      if (url.endsWith("/models")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [{ id: "llama-3.3-70b-versatile" }, { id: "whisper-large-v3" }] }) });
      forced = typeof JSON.parse(route.request().postData() ?? "{}").tool_choice === "object";
      return lessonReply(route);
    });
    await onboard(page);
    await page.getByRole("navigation").getByRole("button", { name: "Настройки" }).click();
    await chooseProvider(page, "Groq");
    await btn(page, /Ключ API Groq/).click();
    await page.getByRole("dialog").getByRole("textbox").fill("gsk_test_0123456789abcdef");
    await page.getByRole("dialog").getByRole("button", { name: "Проверить и сохранить" }).click();
    await expect(page.getByText("Ключ сохранён")).toBeVisible();
    await lessonWorks(page);
    expect(forced).toBe(true);
  });

  test("Custom API: local server without a key → models listed → lesson", async ({ page }) => {
    await mockApis(page, "credits");
    let auth: string | undefined = "unset";
    await page.route("http://192.168.1.50:11434/v1/**", async (route) => {
      const url = route.request().url();
      auth = route.request().headers()["authorization"];
      if (url.endsWith("/models")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [{ id: "qwen3:8b" }, { id: "llama3.1:8b" }] }) });
      return lessonReply(route, true);
    });
    await onboard(page);
    await page.getByRole("navigation").getByRole("button", { name: "Настройки" }).click();
    await chooseProvider(page, "Свой API");
    await expect(page.getByText("Ключ API (необязательно)")).toBeVisible();
    await btn(page, /Адрес сервера/).click();
    await page.getByRole("dialog").getByRole("textbox").fill("192.168.1.50:11434/v1/");
    await page.getByRole("dialog").getByRole("button", { name: "Проверить и сохранить" }).click();
    await expect(page.getByText(/Подключено · найдено 2 модели/)).toBeVisible();
    await expect(page.locator(".menu-row", { hasText: "Адрес сервера" })).toContainText("192.168.1.50:11434/v1");
    await expect(page.locator(".menu-row", { hasText: "Модель" })).toContainText("llama3.1:8b");
    await page.getByRole("navigation").getByRole("button", { name: "Главная" }).click();
    await lessonWorks(page);
    expect(auth).toBeUndefined(); // no key → no Authorization header
  });

  test("Custom API: unreachable server explains what to check", async ({ page }) => {
    await mockApis(page);
    await page.route("http://10.0.0.9:1234/v1/**", (r) => r.abort("connectionrefused"));
    await onboard(page);
    await page.getByRole("navigation").getByRole("button", { name: "Настройки" }).click();
    await chooseProvider(page, "Свой API");
    await btn(page, /Адрес сервера/).click();
    await page.getByRole("dialog").getByRole("textbox").fill("http://10.0.0.9:1234/v1");
    await page.getByRole("dialog").getByRole("button", { name: "Проверить и сохранить" }).click();
    await expect(page.getByRole("alert")).toContainText("принимает подключения с других устройств");
  });
});
