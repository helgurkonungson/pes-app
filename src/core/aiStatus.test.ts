import { describe, expect, it } from "vitest";
import { aiState, classifyApiError, CREDITS_RETRY_MS, isBlocking } from "./aiStatus";

const NOW = Date.parse("2026-10-23T12:00:00Z");
const ago = (ms: number) => new Date(NOW - ms).toISOString();

describe("aiState", () => {
  it("offline mode wins over everything", () => {
    expect(aiState({ aiMode: "offline" }, true, NOW)).toBe("off");
  });
  it("needs a key", () => {
    expect(aiState({}, false, NOW)).toBe("no-key");
    expect(aiState(undefined, false, NOW)).toBe("no-key");
  });
  it("ok with a key and no block", () => {
    expect(aiState({ aiMode: "auto" }, true, NOW)).toBe("ok");
  });
  it("a rejected key stays blocked until fixed", () => {
    expect(aiState({ aiBlock: { kind: "auth", at: ago(10 * CREDITS_RETRY_MS) } }, true, NOW)).toBe("auth");
  });
  it("credits block is retried after a while", () => {
    expect(aiState({ aiBlock: { kind: "credits", at: ago(60_000) } }, true, NOW)).toBe("credits");
    expect(aiState({ aiBlock: { kind: "credits", at: ago(CREDITS_RETRY_MS + 1) } }, true, NOW)).toBe("ok");
  });
});

describe("classifyApiError", () => {
  it.each([
    [400, "Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing to upgrade or purchase credits.", "credits"],
    [402, "Payment required", "credits"],
    [400, "messages: field required", "api"],
    [401, "invalid x-api-key", "auth"],
    [403, "permission_error", "auth"],
    [429, "rate_limit_error", "rate"],
    [529, "overloaded_error", "overloaded"],
    [500, "api_error", "overloaded"],
    [404, "model not found", "api"],
    [429, "You exceeded your current quota, please check your plan and billing details. * Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 10, model: gemini-3.8-flash Please retry in 41.2s. RESOURCE_EXHAUSTED", "rate"],
    [429, "You exceeded your current quota, please check your plan and billing details. insufficient_quota", "credits"],
  ])("%i %s → %s", (status, msg, kind) => {
    expect(classifyApiError(status, msg)).toBe(kind);
  });
  it("blocking kinds", () => {
    expect(isBlocking("credits")).toBe(true);
    expect(isBlocking("auth")).toBe(true);
    expect(isBlocking("no-key")).toBe(true);
    expect(isBlocking("network")).toBe(false);
    expect(isBlocking("rate")).toBe(false);
  });
});
