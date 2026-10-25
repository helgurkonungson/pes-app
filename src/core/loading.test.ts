import { describe, expect, it } from "vitest";
import { loadingPhrase, loadingProgress, PHRASES } from "./loading";

describe("loading screen", () => {
  it("always moves, never reaches 100 % before the lesson is there", () => {
    const blind = [0, 10, 60, 600].map((s) => loadingProgress({ secondsInStep: s, secondsTotal: s }));
    expect(blind[0]).toBe(0);
    expect(blind[1]).toBeGreaterThan(blind[0]);
    expect(blind[2]).toBeGreaterThan(blind[1]);
    expect(blind[3]).toBeLessThanOrEqual(0.9);
  });
  it("follows the writer's steps and creeps inside the current one", () => {
    const steps = { done: 2, total: 5 };
    const start = loadingProgress({ steps, secondsInStep: 0, secondsTotal: 30 });
    const later = loadingProgress({ steps, secondsInStep: 60, secondsTotal: 90 });
    expect(start).toBeCloseTo(0.4);
    expect(later).toBeGreaterThan(start);
    expect(later).toBeLessThan(0.6); // never past the next step
    expect(loadingProgress({ steps: { done: 5, total: 5 }, secondsInStep: 0, secondsTotal: 99 })).toBeLessThan(1);
  });
  it("phrases change every few seconds and match the progress", () => {
    expect(PHRASES.early).toContain(loadingPhrase(0.1, 0));
    expect(loadingPhrase(0.1, 0)).not.toBe(loadingPhrase(0.1, 4));
    expect(PHRASES.mid).toContain(loadingPhrase(0.5, 9));
    expect(PHRASES.late).toContain(loadingPhrase(0.9, 13));
  });
});
