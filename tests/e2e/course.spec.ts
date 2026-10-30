import { expect, test } from "@playwright/test";
import { btn, COURSE_V1, COURSE_V2, finishLesson, mockApis, onboard, skipCountdown } from "./helpers";

test.describe("imported courses", () => {
  test("import → syllabus → lessons in order → re-import keeps progress", async ({ page }) => {
    const api = await mockApis(page, "ok");
    await onboard(page, { key: "sk-ant-test-0123456789abcdef" });
    await page.setInputFiles('[data-testid="course-file"]', COURSE_V1);
    await expect(page.getByRole("heading", { name: "Demo course" })).toBeVisible();
    await expect(page.getByText("Программа курса")).toBeVisible();
    await expect(page.locator(".syllabus-row")).toHaveCount(3);
    // the first session is a placement test from the course; skipping it = start from zero
    await btn(page, /Пройти входной тест/).click();
    await skipCountdown(page);
    await expect(page.getByText(/Несколько вопросов из разных уроков курса/)).toBeVisible();
    await expect(page.getByText(/считаем, что вы начинаете с нуля/)).toBeVisible();
    await btn(page, "Пропустить тест").click();
    await page.getByRole("dialog").getByRole("button", { name: "Пропустить тест" }).click();
    await skipCountdown(page);
    await expect(page.locator(".mode-tag.course")).toBeVisible();
    await finishLesson(page);
    await btn(page, "Закрыть").click();
    await expect(page.locator(".syllabus-row.next")).toContainText("Practice");
    expect(api.calls.filter((c) => c.includes("/v1/messages"))).toHaveLength(0); // courses never call AI

    await btn(page, "Назад").click();
    await page.getByRole("navigation").getByRole("button", { name: "Навыки" }).click();
    await page.setInputFiles('[data-testid="course-file"]', COURSE_V2);
    await expect(page.getByText(/обновлен · 1 новый урок · прогресс сохранен/)).toBeVisible();
    await expect(page.locator(".syllabus-row")).toHaveCount(4);
    await expect(page.locator(".syllabus-row").first().locator(".status.done")).toBeVisible();
    await expect(page.locator(".syllabus-row.next")).toContainText("Inserted");
  });

  test("a file that isn't a course is rejected with a clear message", async ({ page }) => {
    await mockApis(page);
    await onboard(page);
    await page.setInputFiles('[data-testid="course-file"]', { name: "notes.json", mimeType: "application/json", buffer: Buffer.from('{"hello":"world"}') });
    await expect(page.getByText("Этот JSON-файл — не курс «Грызи».")).toBeVisible();
    await page.setInputFiles('[data-testid="course-file"]', { name: "broken.json", mimeType: "application/json", buffer: Buffer.from("{oops") });
    await expect(page.getByText("Это не файл курса (не JSON).")).toBeVisible();
  });
});
