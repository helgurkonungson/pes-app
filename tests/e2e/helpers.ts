import { expect, type Page } from "@playwright/test";
import { fileURLToPath } from "node:url";

export const FIXTURES = fileURLToPath(new URL("../fixtures/", import.meta.url));
export const COURSE_V1 = `${FIXTURES}sample-course.pes.json`;
export const COURSE_V2 = `${FIXTURES}sample-course-v2.pes.json`;

export const SOURCE_TEXT = Array.from(
  { length: 120 },
  (_, i) =>
    `Руководство данными (Data Governance) определяет права принятия решений для набора ${i + 1}. Стюард данных следит за правилами качества и метаданными в каталоге. Линейность данных показывает путь показателей от источника до отчёта номер ${i + 1}.`,
).join("\n\n");

const mcq = (i: number, topic = "Основы") => ({
  q: `Вопрос ${i}: что определяет руководство данными?`,
  options: ["Права принятия решений", "Цвет отчётов", "Размер серверов", "График отпусков"],
  answer: 0,
  explanation: "Руководство данными задаёт права решений и ответственность.",
  difficulty: "m",
  topic,
});

export const AI_LESSON = {
  title: "Права решений в data governance",
  review: { recap: ["Прошлый урок: колесо DAMA"], questions: [mcq(1)] },
  theory: {
    sections: [
      { heading: "Кто решает", body: "**Права решений** закрепляют, кто утверждает определения данных.\n\n- владелец\n- стюард" },
      { heading: "Как внедрить", body: "Начните с одного домена и измеримой цели." },
    ],
    keyPoints: ["Права решений — основа governance", "Начинайте с одного домена"],
  },
  quiz: [mcq(2), mcq(3)],
  open: { q: "Как вы распределите права решений по данным о клиентах?", rubric: ["Назван владелец", "Есть стюард", "Есть метрика"] },
};

/** What a mocked AI returns for each tool; a lesson is written in steps (plan, sections, review, quiz). */
export function toolInput(tool: string, prompt = ""): unknown {
  if (tool === "emit_plan")
    return {
      title: AI_LESSON.title,
      sections: AI_LESSON.theory.sections.map((s, i) => ({ heading: s.heading, focus: `Часть ${i + 1}`, excerpts: [i + 1] })),
      keyPoints: AI_LESSON.theory.keyPoints,
      open: AI_LESSON.open,
    };
  if (tool === "emit_section") {
    const i = Number(prompt.match(/SECTION (\d+) of/)?.[1] ?? 1) - 1;
    return { body: AI_LESSON.theory.sections[i]?.body ?? AI_LESSON.theory.sections[0].body };
  }
  if (tool === "emit_review") return AI_LESSON.review;
  if (tool === "emit_quiz") return { questions: AI_LESSON.quiz };
  if (tool === "emit_placement") return { intro: "Короткий тест.", questions: [1, 2, 3, 4, 5, 6].map((i) => mcq(i, i % 2 ? "Основы" : "Качество")) };
  if (tool === "grade_answer") return { score: 9, verdict: "Сильный ответ.", strengths: ["Назван владелец"], gaps: ["Добавьте метрику"], modelAnswer: "Владелец — коммерческий директор, стюард — аналитик CRM." };
  return AI_LESSON;
}

/** Tool name and prompt of an OpenAI-compatible request (also when it was re-sent without tools). */
export function compatRequest(body: { tools?: { function?: { name?: string } }[]; tool_choice?: { function?: { name?: string } }; messages?: { content?: string }[] }): { tool: string; prompt: string } {
  const tool = body.tool_choice?.function?.name ?? body.tools?.[0]?.function?.name ?? body.messages?.[0]?.content?.match(/result of "(\w+)"|function (\w+)/)?.slice(1).find(Boolean) ?? "";
  return { tool, prompt: body.messages?.[1]?.content ?? "" };
}

type AiMode = "ok" | "credits" | "network" | "auth";

/** Mocks the Claude API (and GitHub releases) so tests never leave the machine. */
export async function mockApis(page: Page, mode: AiMode = "credits"): Promise<{ calls: string[] }> {
  const calls: string[] = [];
  await page.route("https://api.github.com/**", (r) => r.fulfill({ status: 404, body: "{}" }));
  await page.route("https://api.anthropic.com/**", async (route) => {
    const url = route.request().url();
    calls.push(url);
    if (mode === "network") return route.abort("internetdisconnected");
    if (url.includes("/v1/models")) {
      if (mode === "auth") return route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ error: { type: "authentication_error", message: "invalid x-api-key" } }) });
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [{ id: "claude-sonnet-5-5", display_name: "Claude Sonnet 5.5" }] }) });
    }
    if (mode === "credits") {
      return route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ type: "error", error: { type: "invalid_request_error", message: "Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing to upgrade or purchase credits." } }),
      });
    }
    if (mode === "auth") return route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ error: { type: "authentication_error", message: "invalid x-api-key" } }) });
    const body = JSON.parse(route.request().postData() ?? "{}");
    const tool = body.tool_choice?.name as string;
    const input = toolInput(tool, body.messages?.[0]?.content ?? "");
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ id: "msg_1", model: "claude-sonnet-5-5", stop_reason: "tool_use", content: [{ type: "tool_use", id: "tu_1", name: tool, input }] }),
    });
  });
  return { calls };
}

export const btn = (page: Page, name: string | RegExp) => page.getByRole("button", { name }).first();

/** Completes onboarding. `key` = enter an API key (verified against the mocked API). */
export async function onboard(page: Page, opts: { lang?: "ru" | "en"; key?: string; name?: string } = {}): Promise<void> {
  const lang = opts.lang ?? "ru";
  await page.goto("/");
  await page.getByRole("radio", { name: lang === "ru" ? "Русский" : "English" }).click();
  await btn(page, lang === "ru" ? "Начать" : "Get started").click();
  await page.locator("#name").fill(opts.name ?? (lang === "ru" ? "Олег" : "Oleg"));
  await btn(page, lang === "ru" ? /Продолжить/ : /Continue/).click();
  if (opts.key) {
    await page.locator("#key").fill(opts.key);
    await btn(page, lang === "ru" ? /Сохранить и начать/ : /Save and start/).click();
  } else {
    await btn(page, lang === "ru" ? "Продолжить без AI" : "Continue without AI").click();
  }
  await expect(page.getByRole("navigation")).toBeVisible();
}

/** Creates a skillset from pasted text (RU UI). Leaves you on the skillset page — with the placement test skipped unless `keepTest`. */
export async function createSkillsetWithText(page: Page, name = "Управление данными", opts: { keepTest?: boolean } = {}): Promise<void> {
  await page.getByRole("navigation").getByRole("button", { name: "Навыки" }).click();
  await btn(page, /Новый навык/).click();
  await page.locator("#sk-name").fill(name);
  await btn(page, /Создать и добавить источники/).click();
  await btn(page, "Вставить текст").click();
  await page.getByRole("dialog").getByRole("textbox", { name: "Вставить текст" }).fill(SOURCE_TEXT);
  await page.getByRole("dialog").getByRole("button", { name: "Добавить текст" }).click();
  await expect(page.getByText(/Текст · .* слов/)).toBeVisible();
  await btn(page, "Назад").click();
  await expect(page.getByRole("heading", { name })).toBeVisible();
  if (!opts.keepTest) await skipPlacementUI(page);
}

/** Skips the 3-2-1 countdown if it is shown. */
export async function skipCountdown(page: Page): Promise<void> {
  const c = page.getByRole("button", { name: /Нажмите, чтобы пропустить|Tap to skip/ });
  await c
    .waitFor({ state: "visible", timeout: 6000 })
    .then(() => c.click({ timeout: 4000 }))
    .catch(() => undefined); // already running (resumed lesson), or the 3-2-1 ended by itself meanwhile
  await page.locator(".session-body").waitFor({ timeout: 10000 });
}

/** Walks through the open lesson answering the first option, self-checks the open question and finishes. */
export async function finishLesson(page: Page, opts: { aiGrade?: boolean } = {}): Promise<void> {
  for (let guard = 0; guard < 60; guard++) {
    const option = page.locator(".option:not([disabled])").first();
    if (await option.isVisible().catch(() => false)) await option.click();
    const textarea = page.getByRole("textbox", { name: /Ваш ответ|Your answer/ });
    if (await textarea.isVisible().catch(() => false)) {
      await textarea.fill("Назначу владельца данных и стюарда, договорюсь о метрике качества и проверю результат через месяц.");
      if (opts.aiGrade) {
        await btn(page, /Проверить с AI|Check with AI/).click();
      } else {
        await btn(page, /Сравнить с эталоном|Compare with the model answer/).click();
        const boxes = page.locator(".check-row input");
        if (await boxes.count()) await boxes.first().check();
        await btn(page, /Сохранить самопроверку|Save my self-check/).click();
      }
      await expect(page.getByText(/из 10|out of 10/)).toBeVisible();
    }
    const finish = page.getByRole("button", { name: /Завершить|Finish/ });
    if (await finish.isVisible().catch(() => false)) {
      await finish.click();
      await expect(page.getByRole("heading", { name: /Отлично|Well done/ })).toBeVisible();
      return;
    }
    await page.getByRole("button", { name: /^(Далее|Next)/ }).click();
  }
  throw new Error("lesson never finished");
}

/** Fails if the page or any scroll container scrolls horizontally. */
export async function expectNoHorizontalOverflow(page: Page, label = ""): Promise<void> {
  const bad = await page.evaluate(() => {
    const out: string[] = [];
    const doc = document.scrollingElement!;
    if (doc.scrollWidth > window.innerWidth + 1) out.push(`document ${doc.scrollWidth}>${window.innerWidth}`);
    document.querySelectorAll<HTMLElement>(".screen, .session-body, .sheet, .onb").forEach((el) => {
      if (el.scrollWidth > el.clientWidth + 1) {
        // name the widest offender to make the failure actionable
        const right = el.getBoundingClientRect().right;
        const culprit = [...el.querySelectorAll<HTMLElement>("*")].find((c) => c.getBoundingClientRect().right > right + 1);
        out.push(`${el.className} ${el.scrollWidth}>${el.clientWidth} (${culprit?.className || culprit?.tagName || "?"}: ${(culprit?.textContent ?? "").slice(0, 40)})`);
      }
    });
    return out;
  });
  expect(bad, `horizontal overflow ${label}`).toEqual([]);
}

/** Settings → AI provider sheet → pick a provider (Settings tab must be open). */
export async function chooseProvider(page: Page, name: string): Promise<void> {
  await page.getByRole("button", { name: /Провайдер AI|AI provider/ }).click();
  await page.getByRole("dialog").getByRole("radio", { name: new RegExp(`^${name}`) }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}

/** Skips the placement test from the skillset page (confirming that we start from zero). */
export async function skipPlacementUI(page: Page): Promise<void> {
  await btn(page, "Пропустить").click();
  await page.getByRole("dialog").getByRole("button", { name: "Пропустить тест" }).click();
  await expect(page.getByText("Тест пропущен · начинаем с нуля")).toBeVisible();
}
