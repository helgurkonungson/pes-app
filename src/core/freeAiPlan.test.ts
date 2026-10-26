import { describe, expect, it } from "vitest";
import { freeAiPlan, geminiAvailability } from "./freeAiPlan";

describe("free AI plan", () => {
  it("knows where Gemini works", () => {
    expect(geminiAvailability("Europe/Moscow")).toBe("no-api");
    expect(geminiAvailability("Asia/Vladivostok")).toBe("no-api");
    expect(geminiAvailability("Europe/Minsk")).toBe("no-api");
    expect(geminiAvailability("Europe/Berlin")).toBe("no-free-tier");
    expect(geminiAvailability("Europe/London")).toBe("no-free-tier");
    expect(geminiAvailability("Europe/Kyiv")).toBe("yes");
    expect(geminiAvailability("America/New_York")).toBe("yes");
    expect(geminiAvailability(undefined)).toBe("yes");
  });
  it("offers OpenRouter in one tap first for adults everywhere, Gemini second where its free tier works", () => {
    expect(freeAiPlan("adult", "Europe/Moscow")).toEqual({ primary: ["openrouter"], others: ["gemini", "groq", "mistral"] });
    expect(freeAiPlan("adult", "Asia/Kolkata")).toEqual({ primary: ["openrouter", "gemini"], others: ["groq", "mistral"] });
  });
  it("teens get only services that allow their age; children none", () => {
    expect(freeAiPlan("teen", "Europe/Moscow")).toEqual({ primary: ["mistral"], others: [] });
    expect(freeAiPlan("child", "Europe/Moscow")).toEqual({ primary: [], others: [] });
  });
});
