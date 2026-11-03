import { describe, expect, it } from "vitest";
import { MAX_OUTPUT_TOKENS, outputBudget, retryBudget } from "./tokenBudget";

describe("output budgets (1.0)", () => {
  it("non-Latin lessons get more room than English ones", () => {
    const en = outputBudget(2000, "Latin");
    expect(en).toBe(2500);
    expect(outputBudget(2000, "Cyrillic")).toBeGreaterThan(en * 1.7);
    expect(outputBudget(2000, "Devanagari")).toBeGreaterThan(outputBudget(2000, "Cyrillic"));
    expect(outputBudget(2000, null)).toBe(outputBudget(2000, "Cyrillic"));
  });
  it("never asks for more than every API accepts", () => {
    expect(outputBudget(20_000, "Devanagari")).toBe(MAX_OUTPUT_TOKENS);
    expect(retryBudget(12_000)).toBe(MAX_OUTPUT_TOKENS);
    expect(retryBudget(MAX_OUTPUT_TOKENS)).toBe(MAX_OUTPUT_TOKENS);
  });
  it("a retry after a cut-off answer gets at least twice the room", () => {
    expect(retryBudget(1000)).toBe(3000);
    expect(retryBudget(4000)).toBe(8000);
  });
});
