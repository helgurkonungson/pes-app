import { afterEach, describe, expect, it, vi } from "vitest";
import { compatListModels, compatStructured, extractJson } from "./compat";
import { activeProvider, baseUrl, isChatModel, modelOf, pickOpenAiModel, wireModel } from "./providers";

const tool = { name: "emit_x", description: "d", input_schema: { type: "object", properties: { a: { type: "number" } } } };
const call = (id: "openai" | "yandex" | "qwen", cfg = {}) => compatStructured<{ a: number }>(id, "KEY", cfg, { model: "m1", system: "sys", prompt: "p", tool, maxTokens: 900 });

function mockFetch(status: number, data: unknown) {
  const f = vi.fn(async () => new Response(JSON.stringify(data), { status }));
  vi.stubGlobal("fetch", f);
  return f;
}
const sent = (f: ReturnType<typeof mockFetch>) => {
  const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
  return { url, headers: init.headers as Record<string, string>, body: JSON.parse(String(init.body ?? "null")) };
};

afterEach(() => vi.unstubAllGlobals());

describe("provider settings", () => {
  it("defaults to Claude and keeps the Claude model in `model`", () => {
    expect(activeProvider({})).toBe("anthropic");
    expect(modelOf({ model: "claude-x" })).toBe("claude-x");
    expect(modelOf({ provider: "yandex", model: "claude-x" })).toBe("aliceai-llm");
    expect(modelOf({ provider: "qwen", model: "c", providerModels: { qwen: "qwen-max" } })).toBe("qwen-max");
  });
  it("endpoints and Yandex model URIs", () => {
    expect(baseUrl("openai", {})).toBe("https://api.openai.com/v1");
    expect(baseUrl("qwen", {})).toContain("dashscope-intl");
    expect(baseUrl("qwen", { qwenRegion: "cn" })).toBe("https://dashscope.aliyuncs.com/compatible-mode/v1");
    expect(wireModel("yandex", "aliceai-llm", { yandexFolder: " b1gabc " })).toBe("gpt://b1gabc/aliceai-llm");
    expect(wireModel("yandex", "gpt://f/m", { yandexFolder: "x" })).toBe("gpt://f/m");
    expect(wireModel("openai", "gpt-5-mini", {})).toBe("gpt-5-mini");
  });
  it("picks a sensible OpenAI chat model", () => {
    expect(isChatModel("text-embedding-3-large")).toBe(false);
    expect(isChatModel("gpt-4o-realtime-preview")).toBe(false);
    expect(isChatModel("o4-mini")).toBe(true);
    expect(pickOpenAiModel(["gpt-4.1-mini", "gpt-5-mini", "gpt-5", "whisper-1"])).toBe("gpt-5-mini");
    expect(pickOpenAiModel(["gpt-4o", "dall-e-3"])).toBe("gpt-4o");
    expect(pickOpenAiModel([])).toBe("");
  });
});

describe("extractJson", () => {
  it("reads fenced or bare JSON", () => {
    expect(extractJson('Here:\n```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(extractJson('text {"a":{"b":2}} end')).toEqual({ a: { b: 2 } });
    expect(() => extractJson("no json")).toThrow();
  });
});

describe("compatStructured", () => {
  it("OpenAI: forced function call, max_completion_tokens, bearer key", async () => {
    const f = mockFetch(200, { choices: [{ message: { tool_calls: [{ function: { name: "emit_x", arguments: '{"a":5}' } }] } }] });
    expect(await call("openai")).toEqual({ a: 5 });
    const r = sent(f);
    expect(r.url).toBe("https://api.openai.com/v1/chat/completions");
    expect(r.headers.authorization).toBe("Bearer KEY");
    expect(r.body.tool_choice).toEqual({ type: "function", function: { name: "emit_x" } });
    expect(r.body.max_completion_tokens).toBe(900);
    expect(r.body.max_tokens).toBeUndefined();
    expect(r.body.tools[0].function.parameters).toEqual(tool.input_schema);
  });
  it("Yandex: folder header, model URI, tool_choice auto, falls back to JSON in text", async () => {
    const f = mockFetch(200, { choices: [{ message: { content: 'Ответ: {"a":7}' } }] });
    expect(await call("yandex", { yandexFolder: "b1gf" })).toEqual({ a: 7 });
    const r = sent(f);
    expect(r.url).toBe("https://llm.api.cloud.yandex.net/v1/chat/completions");
    expect(r.headers["OpenAI-Project"]).toBe("b1gf");
    expect(r.body.model).toBe("gpt://b1gf/m1");
    expect(r.body.tool_choice).toBe("auto");
    expect(r.body.max_tokens).toBe(900);
  });
  it("Yandex without a folder id is reported as a key problem before any request", async () => {
    const f = mockFetch(200, {});
    await expect(call("yandex")).rejects.toMatchObject({ kind: "auth" });
    expect(f).not.toHaveBeenCalled();
  });
  it.each([
    ["openai", 429, { error: { message: "You exceeded your current quota, please check your plan and billing details.", code: "insufficient_quota" } }, "credits"],
    ["qwen", 400, { code: "Arrearage", message: "Access denied, please make sure your account is in good standing." }, "credits"],
    ["qwen", 401, { code: "InvalidApiKey", message: "Invalid API-key provided." }, "auth"],
    ["openai", 429, { error: { message: "Rate limit reached" } }, "rate"],
    ["openai", 503, { error: { message: "busy" } }, "overloaded"],
  ] as const)("%s %i → %s", async (id, status, data, kind) => {
    mockFetch(status, data);
    await expect(call(id)).rejects.toMatchObject({ kind: kind });
  });
  it("broken arguments → bad-response", async () => {
    mockFetch(200, { choices: [{ message: { tool_calls: [{ function: { name: "emit_x", arguments: "{oops" } }] } }] });
    await expect(call("qwen")).rejects.toMatchObject({ kind: "bad-response" });
  });
  it("no connection → network", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("Failed to fetch"))));
    await expect(call("openai")).rejects.toMatchObject({ kind: "network" });
  });
});

describe("compatListModels", () => {
  it("OpenAI lists chat models only", async () => {
    mockFetch(200, { data: [{ id: "gpt-5-mini" }, { id: "text-embedding-3-small" }, { id: "o4-mini" }] });
    expect((await compatListModels("openai", "K", {})).map((m) => m.id)).toEqual(["gpt-5-mini", "o4-mini"]);
  });
  it("Yandex verifies the key with a 1-token request and returns the fixed list", async () => {
    const f = mockFetch(200, { choices: [{ message: { content: "p" } }] });
    const list = await compatListModels("yandex", "K", { yandexFolder: "b1g" });
    expect(list[0]).toEqual({ id: "aliceai-llm", display_name: "Alice AI LLM" });
    expect(sent(f).body.max_tokens).toBe(1);
  });
});
