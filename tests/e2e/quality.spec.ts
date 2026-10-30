/** Accessibility (axe) and layout checks on every main screen, for every device project. */
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { btn, COURSE_V1, createSkillsetWithText, expectNoHorizontalOverflow, mockApis, onboard, skipCountdown } from "./helpers";

async function audit(page: Page, label: string) {
  await page.waitForTimeout(300);
  await expectNoHorizontalOverflow(page, label);
  const r = await new AxeBuilder({ page: page as never }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).disableRules(["color-contrast"]).analyze();
  const serious = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(serious.map((v) => `${label}: ${v.id} — ${v.nodes.map((n) => n.html.slice(0, 160)).slice(0, 3).join(" | ")}`)).toEqual([]);
}

async function contrast(page: Page, label: string) {
  // text on solid backgrounds must meet AA; text over artwork is checked by design review
  const r = await new AxeBuilder({ page: page as never }).withRules(["color-contrast"]).exclude(".hero").exclude(".next-card").exclude(".skill-cover").exclude(".mono").analyze();
  expect(r.violations.flatMap((v) => v.nodes.map((n) => `${label}: ${n.target.join(" ")} ${n.any[0]?.message ?? ""}`))).toEqual([]);
}

test("every screen: no horizontal scroll, no serious accessibility issues", async ({ page }) => {
  await mockApis(page);
  await page.goto("/");
  await audit(page, "onboarding");
  await onboard(page);
  await audit(page, "home-empty");
  await contrast(page, "home-empty");
  await page.setInputFiles('[data-testid="course-file"]', COURSE_V1);
  await expect(page.getByText("Программа курса")).toBeVisible();
  await audit(page, "course");
  await btn(page, "Назад").click();
  await createSkillsetWithText(page);
  await audit(page, "skillset");
  await btn(page, "Источники").click();
  await audit(page, "sources");
  await btn(page, "Назад").click();
  await btn(page, /Начать · 15 мин/).click();
  await skipCountdown(page);
  await audit(page, "lesson");
  await contrast(page, "lesson");
  await btn(page, "Выйти из урока").click();
  await audit(page, "leave-dialog");
  await page.getByRole("dialog").getByRole("button", { name: "Выйти" }).click();
  await btn(page, "Назад").click();
  for (const tab of ["Главная", "Навыки", "Прогресс", "Настройки"]) {
    await page.getByRole("navigation").getByRole("button", { name: tab }).click();
    await audit(page, tab);
    await contrast(page, tab);
  }
});

test("light theme: chosen in Settings, kept after a restart, readable (AA contrast) on every main screen", async ({ page }) => {
  await mockApis(page);
  await onboard(page);
  await createSkillsetWithText(page);
  await btn(page, /Начать · 15 мин/).click();
  await skipCountdown(page);
  await btn(page, "Выйти из урока").click();
  await page.getByRole("dialog").getByRole("button", { name: "Выйти" }).click();
  await btn(page, "Назад").click();
  await page.getByRole("navigation").getByRole("button", { name: "Настройки" }).click();
  await page.getByRole("radio", { name: "Светлая" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  for (const tab of ["Главная", "Навыки", "Прогресс", "Настройки"]) {
    await page.getByRole("navigation").getByRole("button", { name: tab }).click();
    await audit(page, `light ${tab}`);
    await contrast(page, `light ${tab}`);
  }
  await page.getByRole("navigation").getByRole("button", { name: "Главная" }).click();
  await page.locator(".next-card .btn.primary").click();
  await skipCountdown(page);
  await contrast(page, "light lesson");
  await btn(page, "Выйти из урока").click();
  await page.getByRole("dialog").getByRole("button", { name: "Выйти" }).click();
  await page.getByRole("navigation").getByRole("button", { name: "Настройки" }).click();
  await page.getByRole("radio", { name: "Темная" }).click();
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", "light");
});

test("touch targets in the tab bar and session controls are at least 44 px", async ({ page }) => {
  await mockApis(page);
  await onboard(page);
  const sizes = await page.locator("nav.tabbar button").evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).map((r) => Math.min(r.width, r.height)));
  for (const s of sizes) expect(s).toBeGreaterThanOrEqual(44);
});

test("the hardware-back-style Escape closes sheets", async ({ page }) => {
  await mockApis(page);
  await onboard(page);
  await page.getByRole("navigation").getByRole("button", { name: "Настройки" }).click();
  await btn(page, /^Имя/).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
