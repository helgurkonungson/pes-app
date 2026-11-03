import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let profile: Record<string, unknown> = { provider: "chompbook" };
vi.mock("./key", () => ({ getApiKey: async () => "KEY" }));
vi.mock("../data/db", () => ({ getProfile: async () => profile }));
vi.mock("./usage", () => ({ recordMonthly: async () => {} }));

import { structured } from "./client";
import { retryPolicy } from "./compat";

const tool = { name: "emit_x", description: "d", input_schema: { type: "object", properties: { a: { type: "number" } } } };
const opts = { model: "m", system: "s", prompt: "p", tool, maxTokens: 1000 };

function replies(...list: unknown[]) {
  const f = vi.fn(async () => new Response(JSON.stringify(list.length > 1 ? list.shift() : list[0]), { status: 200 }));
  vi.stubGlobal("fetch", f);
  return f;
}
const budgetOf = (f: ReturnType<typeof vi.fn>, i: number) => {
  const b = JSON.parse(String((f.mock.calls[i] as unknown as [string, RequestInit])[1].body));
  return b.max_tokens ?? b.max_completion_tokens;
};
const cut = { choices: [{ finish_reason: "length", message: { tool_calls: [{ function: { name: "emit_x", arguments: '{"a":' } }] } }] };
const cutEmpty = { choices: [{ finish_reason: "length", message: { content: "" } }] };
const good = { choices: [{ finish_reason: "tool_calls", message: { tool_calls: [{ function: { name: "emit_x", arguments: '{"a":4}' } }] } }] };

beforeEach(() => {
  retryPolicy.delaysMs = [0, 0];
  profile = { provider: "chompbook" };
});
afterEach(() => vi.unstubAllGlobals());

describe("an answer cut off at the budget (finish_reason: length) — 1.0", () => {
  it("is asked once more with a bigger budget", async () => {
    const f = replies(cut, good);
    expect(await structured<{ a: number }>(opts)).toEqual({ a: 4 });
    expect(f).toHaveBeenCalledTimes(2);
    expect(budgetOf(f, 0)).toBe(1000);
    expect(budgetOf(f, 1)).toBe(3000);
  });
  it("an empty cut-off answer (a model that thought too long) is retried too", async () => {
    const f = replies(cutEmpty, good);
    expect(await structured<{ a: number }>(opts)).toEqual({ a: 4 });
    expect(f).toHaveBeenCalledTimes(2);
  });
  it("gives up after the bigger try, keeping the reason for the learner", async () => {
    const f = replies(cut);
    await expect(structured(opts)).rejects.toMatchObject({ kind: "bad-response", detail: "finish_reason: length", truncated: true });
    expect(f).toHaveBeenCalledTimes(2);
  });
  it("other format problems are not re-sent here (the lesson step asks again itself)", async () => {
    const f = replies({ choices: [{ finish_reason: "stop", message: { content: "no json" } }] });
    await expect(structured(opts)).rejects.toMatchObject({ kind: "bad-response", truncated: false });
    expect(f).toHaveBeenCalledTimes(1);
  });
  it("Claude: stop_reason max_tokens is retried with a bigger budget", async () => {
    profile = {};
    const f = replies(
      { id: "1", model: "c", stop_reason: "max_tokens", content: [{ type: "tool_use", id: "t", name: "emit_x", input: {} }] },
      { id: "2", model: "c", stop_reason: "tool_use", content: [{ type: "tool_use", id: "t", name: "emit_x", input: { a: 2 } }] },
    );
    expect(await structured<{ a: number }>(opts)).toEqual({ a: 2 });
    expect(budgetOf(f, 1)).toBe(3000);
  });
});
