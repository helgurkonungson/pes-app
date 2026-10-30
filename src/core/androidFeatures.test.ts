/** Pure rules behind the 0.19.2 Android features: per-app language sync, rating prompt, widget texts. */
import { describe, expect, it } from "vitest";
import { langOfTag, syncAppLanguage, tagOf } from "./appLanguage";
import { recordReviewAsk, REVIEW_ASK, shouldAskForReview } from "./reviewAsk";
import { widgetData } from "./widget";

describe("per-app language (Android 13+)", () => {
  it("maps app languages to Android tags and back", () => {
    expect(tagOf("system")).toBe("");
    expect(tagOf("zh")).toBe("zh-CN");
    expect(tagOf("ru")).toBe("ru");
    expect(langOfTag("zh-Hans-CN")).toBe("zh");
    expect(langOfTag("de-AT")).toBe("de");
    expect(langOfTag("")).toBe("system");
    expect(langOfTag("pt-BR")).toBe("system");
  });

  it("first run: the app's own choice is pushed; equal values need nothing", () => {
    expect(syncAppLanguage("ru", "", null)).toEqual({ kind: "push", tag: "ru" });
    expect(syncAppLanguage("system", "", null)).toEqual({ kind: "none" });
    expect(syncAppLanguage("de", "de-DE", "de")).toEqual({ kind: "none" });
  });

  it("changed in Android Settings → adopted; changed in the app → pushed", () => {
    expect(syncAppLanguage("ru", "fr", "ru")).toEqual({ kind: "adopt", lang: "fr" });
    expect(syncAppLanguage("ru", "", "ru")).toEqual({ kind: "adopt", lang: "system" }); // reset to the system default
    expect(syncAppLanguage("fr", "ru", "ru")).toEqual({ kind: "push", tag: "fr" });
    expect(syncAppLanguage("system", "ru", "ru")).toEqual({ kind: "push", tag: "" });
  });
});

describe("asking for a Google Play rating", () => {
  const now = new Date("2026-11-01T12:00:00Z");
  it("only after a few lessons, at a good moment", () => {
    expect(shouldAskForReview({ lessonsDone: 2, openScore: 10, streak: 7, now })).toBe(false);
    expect(shouldAskForReview({ lessonsDone: 3, openScore: REVIEW_ASK.minScore, streak: 1, now })).toBe(true);
    expect(shouldAskForReview({ lessonsDone: 3, openScore: 6, streak: 7, now })).toBe(true); // streak milestone
    expect(shouldAskForReview({ lessonsDone: 3, openScore: 6, streak: 5, now })).toBe(false);
    expect(shouldAskForReview({ lessonsDone: 9, streak: 4, now })).toBe(false); // no open answer, no milestone
  });

  it("rarely: months apart and a few times at most", () => {
    const first = recordReviewAsk(undefined, new Date("2026-08-01T00:00:00Z"));
    expect(first.count).toBe(1);
    expect(shouldAskForReview({ lessonsDone: 20, openScore: 9, streak: 2, state: first, now: new Date("2026-10-01T00:00:00Z") })).toBe(false);
    expect(shouldAskForReview({ lessonsDone: 20, openScore: 9, streak: 2, state: first, now: new Date("2026-12-01T00:00:00Z") })).toBe(true);
    expect(shouldAskForReview({ lessonsDone: 20, openScore: 9, streak: 2, state: { at: "2020-01-01T00:00:00Z", count: REVIEW_ASK.maxAsks }, now })).toBe(false);
    expect(shouldAskForReview({ lessonsDone: 20, openScore: 9, streak: 2, state: { at: "garbage", count: 1 }, now })).toBe(false);
  });
});

describe("home-screen widget texts", () => {
  const t = (k: string, p?: Record<string, string | number>) => `${k}${p ? JSON.stringify(p) : ""}`;
  it("minutes left today, the goal for a fresh day, a tick when done", () => {
    const d = widgetData({ day: "2026-11-01", streak: 4, minutes: 6.4, goal: 15 }, t as never);
    expect(d).toEqual({ day: "2026-11-01", streak: 4, streakLabel: 'widget.streak{"n":4}', status: 'home.minLeft{"n":9}', newDayStatus: 'home.minLeft{"n":15}', cta: "widget.cta" });
    expect(widgetData({ day: "x", streak: -1, minutes: 20, goal: 15 }, t as never).status).toBe("✓ home.goalDone");
    expect(widgetData({ day: "x", streak: -1, minutes: 20, goal: 15 }, t as never).streak).toBe(0);
  });
});
