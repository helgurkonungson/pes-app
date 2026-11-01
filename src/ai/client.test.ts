import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./key", () => ({ getApiKey: async () => "sk-ant-test" }));
vi.mock("../data/db", () => ({ getProfile: async () => ({}) }));
vi.mock("./usage", () => ({ recordMonthly: async () => {} }));

import { createMessage, retryAfterMs } from "./client";
import { retryPolicy } from "./compat";

const ok = { id: "m", model: "claude", stop_reason: "end_turn", content: [{ type: "text", text: "hi" }] };
const params = { model: "claude", system: "s", messages: [{ role: "user" as const, content: "p" }], max_tokens: 10 };

/** Replies in order (null = dropped connection); the last one repeats. */
function replies(...list: ([number, unknown, Record<string, string>?] | null)[]) {
  const f = vi.fn(async () => {
    const r = list.length > 1 ? list.shift()! : list[0];
    if (r === null) throw new TypeError("Failed to fetch");
    return new Response(JSON.stringify(r[1]), { status: r[0], headers: r[2] });
  });
  vi.stubGlobal("fetch", f);
  return f;
}

beforeEach(() => {
  retryPolicy.delaysMs = [0, 0];
  retryPolicy.rateScale = 0;
});
afterEach(() => {
  vi.unstubAllGlobals();
  retryPolicy.delaysMs = [2_000, 5_000];
  retryPolicy.rateScale = 1;
});

describe("Claude requests are re-sent after temporary failures", () => {
  it("overloaded (529) and server errors are retried", async () => {
    const f = replies([529, { error: { message: "Overloaded" } }], [500, { error: { message: "Internal" } }], [200, ok]);
    expect((await createMessage(params)).id).toBe("m");
    expect(f).toHaveBeenCalledTimes(3);
  });
  it("a rate limit waits as long as retry-after says", async () => {
    const f = replies([429, { error: { message: "rate_limit_error" } }, { "retry-after": "3" }], [200, ok]);
    expect((await createMessage(params)).id).toBe("m");
    expect(f).toHaveBeenCalledTimes(2);
    retryPolicy.rateScale = 1;
    expect(retryAfterMs("3")).toBe(3000);
    expect(retryAfterMs("600")).toBeNull();
    expect(retryAfterMs(null)).toBeNull();
  });
  it("a dropped connection is retried", async () => {
    const f = replies(null, [200, ok]);
    expect((await createMessage(params)).id).toBe("m");
    expect(f).toHaveBeenCalledTimes(2);
  });
  it("gives up after the retries with the API's words", async () => {
    const f = replies([529, { error: { message: "Overloaded" } }]);
    await expect(createMessage(params)).rejects.toMatchObject({ kind: "overloaded", status: 529, detail: "Overloaded" });
    expect(f).toHaveBeenCalledTimes(3);
  });
  it("key and credit problems are not retried", async () => {
    let f = replies([401, { error: { message: "invalid x-api-key" } }]);
    await expect(createMessage(params)).rejects.toMatchObject({ kind: "auth" });
    expect(f).toHaveBeenCalledTimes(1);
    f = replies([400, { error: { message: "Your credit balance is too low to access the Anthropic API." } }]);
    await expect(createMessage(params)).rejects.toMatchObject({ kind: "credits" });
    expect(f).toHaveBeenCalledTimes(1);
  });
});
