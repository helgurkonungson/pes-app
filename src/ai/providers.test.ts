import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { compatListModels, compatStructured, extractJson, GEMINI_THINKING_TOKENS, isDailyLimit, isGeminiThinking, rateLimitWaitMs, retryPolicy } from "./compat";
import { activeProvider, baseUrl, chatModels, isChatModel, isNvidiaChatModel, modelOf, normalizeBaseUrl, openRouterModels, pickDefaultModel, pickOpenAiModel, wireModel } from "./providers";

const tool = { name: "emit_x", description: "d", input_schema: { type: "object", properties: { a: { type: "number" } } } };
const call = (id: "openai" | "yandex" | "qwen" | "nvidia" | "gemini" | "groq" | "custom" | "chompbook", cfg = {}) => compatStructured<{ a: number }>(id, "KEY", cfg, { model: "m1", system: "sys", prompt: "p", tool, maxTokens: 900 });

function mockFetch(status: number, data: unknown) {
  const f = vi.fn(async () => new Response(JSON.stringify(data), { status }));
  vi.stubGlobal("fetch", f);
  return f;
}
const sent = (f: ReturnType<typeof mockFetch>) => {
  const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
  return { url, headers: init.headers as Record<string, string>, body: JSON.parse(String(init.body ?? "null")) };
};

/** Replies in order; the last one repeats. */
function mockReplies(...replies: [number, unknown][]) {
  const f = vi.fn(async () => {
    const [status, data] = replies.length > 1 ? replies.shift()! : replies[0];
    return new Response(JSON.stringify(data), { status });
  });
  vi.stubGlobal("fetch", f);
  return f;
}
const bodyOf = (f: ReturnType<typeof vi.fn>, i: number) => JSON.parse(String((f.mock.calls[i] as unknown as [string, RequestInit])[1].body));

beforeEach(() => {
  retryPolicy.delaysMs = [0, 0];
});
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
  it("Chompbook AI: our server, the Pro id as the key, teen safety unless the learner is an adult", async () => {
    const reply = { choices: [{ message: { tool_calls: [{ function: { name: "emit_x", arguments: '{"a":3}' } }] } }] };
    let f = mockFetch(200, reply);
    expect(await call("chompbook")).toEqual({ a: 3 });
    expect(sent(f).url).toBe("https://api.chompbook.online/v1/chat/completions");
    expect(sent(f).headers.authorization).toBe("Bearer KEY");
    expect(sent(f).headers["x-chompbook-audience"]).toBe("teen");
    f = mockFetch(200, reply);
    await call("chompbook", { ageGroup: "adult" });
    expect(sent(f).headers["x-chompbook-audience"]).toBe("adult");
    f = mockFetch(200, reply);
    await call("openai", { ageGroup: "adult" });
    expect(sent(f).headers["x-chompbook-audience"]).toBeUndefined();
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
  it("OpenRouter checks the key itself first (its model list needs no key)", async () => {
    const f = mockReplies([200, { data: { label: "k" } }], [200, { data: [{ id: "x/y:free" }] }]);
    expect((await compatListModels("openrouter", "K", {})).map((m) => m.id)).toEqual(["x/y:free"]);
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://openrouter.ai/api/v1/key");
    expect((init.headers as Record<string, string>)["X-Title"]).toBe("Chompbook");
    mockReplies([401, { error: { message: "No auth credentials found", code: 401 } }]);
    await expect(compatListModels("openrouter", "bad", {})).rejects.toMatchObject({ kind: "auth" });
  });
  it("Yandex verifies the key with a 1-token request and returns the fixed list", async () => {
    const f = mockFetch(200, { choices: [{ message: { content: "p" } }] });
    const list = await compatListModels("yandex", "K", { yandexFolder: "b1g" });
    expect(list[0]).toEqual({ id: "aliceai-llm", display_name: "Alice AI LLM" });
    expect(sent(f).body.max_tokens).toBe(1);
  });
});

describe("NVIDIA", () => {
  it("endpoint, default model and model filter", () => {
    expect(baseUrl("nvidia", {})).toBe("https://integrate.api.nvidia.com/v1");
    expect(modelOf({ provider: "nvidia", model: "c" })).toBe("meta/llama-3.3-70b-instruct");
    expect(isNvidiaChatModel("meta/llama-3.3-70b-instruct")).toBe(true);
    expect(isNvidiaChatModel("nvidia/llama-3.3-nemotron-super-49b-v1")).toBe(true);
    expect(isNvidiaChatModel("deepseek-ai/deepseek-r1")).toBe(true);
    expect(isNvidiaChatModel("nvidia/nv-embedqa-e5-v5")).toBe(false);
    expect(isNvidiaChatModel("nvidia/llama-3.2-nv-rerankqa-1b-v2")).toBe(false);
    expect(isNvidiaChatModel("meta/llama-guard-4-12b")).toBe(false);
  });
  it("asks for the function without forcing it and accepts a tool call", async () => {
    const f = mockFetch(200, { choices: [{ message: { tool_calls: [{ function: { name: "emit_x", arguments: '{"a":3}' } }] } }] });
    expect(await call("nvidia")).toEqual({ a: 3 });
    const r = sent(f);
    expect(r.url).toBe("https://integrate.api.nvidia.com/v1/chat/completions");
    expect(r.headers.authorization).toBe("Bearer KEY");
    expect(r.body.tool_choice).toBe("auto");
    expect(r.body.max_tokens).toBe(900);
  });
  it("falls back to JSON in the text answer", async () => {
    mockFetch(200, { choices: [{ message: { content: "```json\n{\"a\":4}\n```" } }] });
    expect(await call("nvidia")).toEqual({ a: 4 });
  });
  it("lists only chat models", async () => {
    mockFetch(200, { data: [{ id: "meta/llama-3.3-70b-instruct" }, { id: "nvidia/nv-embedqa-e5-v5" }, { id: "qwen/qwen3-235b-a22b" }] });
    expect((await compatListModels("nvidia", "K", {})).map((m) => m.id)).toEqual(["meta/llama-3.3-70b-instruct", "qwen/qwen3-235b-a22b"]);
  });
  it("credits exhausted (402) → credits", async () => {
    mockFetch(402, { detail: "Payment Required" });
    await expect(call("nvidia")).rejects.toMatchObject({ kind: "credits" });
  });
});

describe("error details", () => {
  it("keeps the provider's own message and id (Yandex folder permission)", async () => {
    mockFetch(403, { error: { message: "rpc error: code = PermissionDenied desc = Permission to [resource-manager.folder b1gx] denied", type: "permission_error" } });
    await expect(call("yandex", { yandexFolder: "b1gx" })).rejects.toMatchObject({ kind: "auth", status: 403, provider: "yandex", detail: expect.stringContaining("PermissionDenied") });
  });
});

describe("Gemini, Groq, custom", () => {
  it("endpoints and server address normalization", () => {
    expect(baseUrl("gemini", {})).toBe("https://generativelanguage.googleapis.com/v1beta/openai");
    expect(baseUrl("groq", {})).toBe("https://api.groq.com/openai/v1");
    expect(normalizeBaseUrl(" 192.168.1.5:11434/v1/ ")).toBe("http://192.168.1.5:11434/v1");
    expect(normalizeBaseUrl("https://my.proxy/v1/chat/completions")).toBe("https://my.proxy/v1");
    expect(normalizeBaseUrl("")).toBe("");
    expect(baseUrl("custom", { customBaseUrl: "localhost:1234/v1" })).toBe("http://localhost:1234/v1");
  });
  it("model lists and defaults", () => {
    expect(chatModels("gemini", ["models/gemini-3.8-flash", "models/gemini-embedding-001", "models/imagen-4", "models/gemini-3.8-flash"])).toEqual(["gemini-3.8-flash"]);
    expect(pickDefaultModel("gemini", ["models/gemini-2.5-flash", "models/gemini-3.8-flash", "models/gemini-3.8-flash-lite", "models/gemini-3-pro-preview"])).toBe("gemini-3.8-flash");
    expect(pickDefaultModel("gemini", ["models/gemini-flash-latest"])).toBe("gemini-flash-latest");
    expect(chatModels("groq", ["llama-3.3-70b-versatile", "whisper-large-v3", "meta-llama/llama-guard-4-12b", "openai/gpt-oss-120b"])).toEqual(["llama-3.3-70b-versatile", "openai/gpt-oss-120b"]);
    expect(pickDefaultModel("groq", ["llama-3.3-70b-versatile"])).toBe("llama-3.3-70b-versatile");
    expect(pickDefaultModel("groq", ["openai/gpt-oss-120b", "llama-3.3-70b-versatile"])).toBe("openai/gpt-oss-120b");
    expect(pickDefaultModel("groq", ["some-new-model"])).toBe(""); // keep the built-in default
    expect(pickDefaultModel("custom", ["qwen3:8b", "llama3.1:8b"])).toBe("llama3.1:8b");
    expect(modelOf({ provider: "groq", model: "c" })).toBe("llama-3.3-70b-versatile");
    expect(modelOf({ provider: "custom", model: "c" })).toBe("");
  });
  it("Groq forces the function; Gemini asks with auto", async () => {
    let f = mockFetch(200, { choices: [{ message: { tool_calls: [{ function: { name: "emit_x", arguments: '{"a":1}' } }] } }] });
    await call("groq");
    expect(sent(f).url).toBe("https://api.groq.com/openai/v1/chat/completions");
    expect(sent(f).body.tool_choice).toEqual({ type: "function", function: { name: "emit_x" } });
    vi.unstubAllGlobals();
    f = mockFetch(200, { choices: [{ message: { content: '{"a":2}' } }] });
    expect(await call("gemini")).toEqual({ a: 2 });
    expect(sent(f).body.tool_choice).toBe("auto");
  });
  it("custom: no Authorization header without a key; needs an address and a model", async () => {
    const f = mockFetch(200, { choices: [{ message: { content: '{"a":9}' } }] });
    expect(await compatStructured("custom", "", { customBaseUrl: "http://10.0.0.2:11434/v1" }, { model: "llama3.1:8b", system: "s", prompt: "p", tool, maxTokens: 100 })).toEqual({ a: 9 });
    expect(sent(f).url).toBe("http://10.0.0.2:11434/v1/chat/completions");
    expect(sent(f).headers.authorization).toBeUndefined();
    await expect(compatStructured("custom", "", {}, { model: "m", system: "s", prompt: "p", tool, maxTokens: 100 })).rejects.toMatchObject({ kind: "no-key" });
    await expect(compatStructured("custom", "", { customBaseUrl: "http://x/v1" }, { model: "", system: "s", prompt: "p", tool, maxTokens: 100 })).rejects.toMatchObject({ kind: "no-key" });
  });
  it("retries without forcing when a server rejects tool_choice", async () => {
    const replies = [
      new Response(JSON.stringify({ error: { message: "tool_choice is not supported" } }), { status: 400 }),
      new Response(JSON.stringify({ choices: [{ message: { content: '{"a":5}' } }] }), { status: 200 }),
    ];
    const f = vi.fn(async () => replies.shift()!);
    vi.stubGlobal("fetch", f);
    expect(await call("groq")).toEqual({ a: 5 });
    expect(f).toHaveBeenCalledTimes(2);
    expect(JSON.parse(String((f.mock.calls[1] as unknown as [string, RequestInit])[1].body)).tool_choice).toBe("auto");
  });
});

describe("Gemini lessons (0.4.2)", () => {
  const overloaded = [{ error: { code: 503, message: "The model is overloaded. Please try again later.", status: "UNAVAILABLE" } }];
  const ok = { choices: [{ message: { tool_calls: [{ function: { name: "emit_x", arguments: '{"a":1}' } }] }, finish_reason: "stop" }] };

  it("low thinking and extra token room for thinking models only", async () => {
    let f = mockFetch(200, ok);
    await compatStructured("gemini", "K", {}, { model: "gemini-3.8-flash", system: "s", prompt: "p", tool, maxTokens: 900 });
    expect(sent(f).body.reasoning_effort).toBe("low");
    expect(sent(f).body.max_tokens).toBe(900 + GEMINI_THINKING_TOKENS);
    vi.unstubAllGlobals();
    f = mockFetch(200, ok);
    await compatStructured("gemini", "K", {}, { model: "gemini-2.0-flash", system: "s", prompt: "p", tool, maxTokens: 900 });
    expect(sent(f).body.reasoning_effort).toBeUndefined();
    expect(isGeminiThinking("gemini-flash-latest")).toBe(true);
    expect(isGeminiThinking("gemini-2.5-flash-lite")).toBe(true);
    expect(isGeminiThinking("gemini-1.5-pro")).toBe(false);
  });
  it("other providers get no reasoning_effort", async () => {
    const f = mockFetch(200, ok);
    await call("nvidia");
    expect(sent(f).body.reasoning_effort).toBeUndefined();
  });
  it("reads Gemini's array-wrapped errors and keeps status + message", async () => {
    mockFetch(400, [{ error: { code: 400, message: "API key not valid. Please pass a valid API key.", status: "INVALID_ARGUMENT" } }]);
    await expect(call("gemini")).rejects.toMatchObject({ kind: "api", status: 400, provider: "gemini", detail: "API key not valid. Please pass a valid API key. INVALID_ARGUMENT" });
  });
  it("re-sends a 503 and succeeds", async () => {
    const f = mockReplies([503, overloaded], [503, overloaded], [200, ok]);
    expect(await call("gemini")).toEqual({ a: 1 });
    expect(f).toHaveBeenCalledTimes(3);
    expect(bodyOf(f, 2).tools).toBeDefined();
  });
  it("still failing after the retries → one plainer round without tools, with the schema in the prompt", async () => {
    const f = mockReplies([503, overloaded], [503, overloaded], [503, overloaded], [200, { choices: [{ message: { content: '{"a":6}' } }] }]);
    expect(await call("gemini")).toEqual({ a: 6 });
    expect(f).toHaveBeenCalledTimes(4);
    const last = bodyOf(f, 3);
    expect(last.tools).toBeUndefined();
    expect(last.tool_choice).toBeUndefined();
    expect(last.messages[0].content).toContain('"properties"');
  });
  it("a timeout (504) is not re-sent as is: goes straight to the plainer request", async () => {
    const f = mockReplies([504, [{ error: { code: 504, message: "Deadline expired before operation could complete.", status: "DEADLINE_EXCEEDED" } }]], [200, { choices: [{ message: { content: '{"a":8}' } }] }]);
    expect(await call("gemini")).toEqual({ a: 8 });
    expect(f).toHaveBeenCalledTimes(2);
    expect(bodyOf(f, 1).tools).toBeUndefined();
  });
  it("gives up with the provider's words after the plainer round fails too", async () => {
    const f = mockReplies([503, overloaded]);
    await expect(call("gemini")).rejects.toMatchObject({ kind: "overloaded", status: 503, detail: "The model is overloaded. Please try again later. UNAVAILABLE" });
    expect(f).toHaveBeenCalledTimes(6);
  });
  it("drops reasoning_effort when a model refuses it", async () => {
    const f = mockReplies([400, [{ error: { code: 400, message: "Thinking is not supported for this model.", status: "INVALID_ARGUMENT" } }]], [200, ok]);
    expect(await compatStructured("gemini", "K", {}, { model: "gemini-3.8-flash", system: "s", prompt: "p", tool, maxTokens: 900 })).toEqual({ a: 1 });
    expect(bodyOf(f, 0).reasoning_effort).toBe("low");
    expect(bodyOf(f, 1).reasoning_effort).toBeUndefined();
    expect(bodyOf(f, 1).tools).toBeDefined();
  });
  it("cancelling during the pause stops the retries", async () => {
    retryPolicy.delaysMs = [60_000];
    const f = mockReplies([503, overloaded]);
    const ctrl = new AbortController();
    const p = compatStructured("gemini", "K", {}, { model: "gemini-3.8-flash", system: "s", prompt: "p", tool, maxTokens: 900, signal: ctrl.signal });
    await vi.waitFor(() => expect(f).toHaveBeenCalledTimes(1));
    ctrl.abort();
    await expect(p).rejects.toMatchObject({ kind: "aborted" });
  });
  it("format failures carry finish_reason", async () => {
    mockFetch(200, { choices: [{ message: { content: null }, finish_reason: "length" }] });
    await expect(call("gemini")).rejects.toMatchObject({ kind: "bad-response", detail: "finish_reason: length", provider: "gemini" });
  });
});

describe("per-minute rate limits (0.6.0)", () => {
  const perMinute = [{ error: { code: 429, message: "You exceeded your current quota. Please retry in 41.2s.", status: "RESOURCE_EXHAUSTED", details: [{ "@type": "type.googleapis.com/google.rpc.RetryInfo", retryDelay: "41s" }] } }];
  const ok = { choices: [{ message: { tool_calls: [{ function: { name: "emit_x", arguments: '{"a":1}' } }] }, finish_reason: "stop" }] };
  afterEach(() => {
    retryPolicy.rateScale = 1;
  });
  it("reads how long to wait, and refuses daily quotas or long waits", () => {
    expect(rateLimitWaitMs(perMinute)).toBe(42_200);
    expect(rateLimitWaitMs({ error: { details: [{ retryDelay: "12s" }] } })).toBe(13_000);
    expect(rateLimitWaitMs({ error: { message: "Quota exceeded for metric: generate_content_free_tier_requests, limit: 250, GenerateRequestsPerDayPerProjectPerModel. Please retry in 30s." } })).toBeNull();
    expect(rateLimitWaitMs({ error: { message: "Please retry in 300s." } })).toBeNull();
    expect(rateLimitWaitMs({ error: { message: "Too many requests" } })).toBeNull();
  });
  it("waits out a per-minute 429 and continues", async () => {
    retryPolicy.rateScale = 0;
    const f = mockReplies([429, perMinute], [200, ok]);
    expect(await compatStructured("gemini", "K", {}, { model: "gemini-3.8-flash", system: "s", prompt: "p", tool, maxTokens: 900 })).toEqual({ a: 1 });
    expect(f).toHaveBeenCalledTimes(2);
  });
  it("still limited after two waits → rate error with Google's words", async () => {
    retryPolicy.rateScale = 0;
    const f = mockReplies([429, perMinute]);
    await expect(compatStructured("gemini", "K", {}, { model: "gemini-3.8-flash", system: "s", prompt: "p", tool, maxTokens: 900 })).rejects.toMatchObject({ kind: "rate", status: 429 });
    expect(f).toHaveBeenCalledTimes(3);
  });
});

describe("Mistral and OpenRouter", () => {
  it("endpoints, model lists and free defaults", () => {
    expect(baseUrl("mistral", {})).toBe("https://api.mistral.ai/v1");
    expect(baseUrl("openrouter", {})).toBe("https://openrouter.ai/api/v1");
    expect(chatModels("mistral", ["mistral-small-latest", "mistral-embed", "mistral-ocr-latest", "magistral-medium-latest"])).toEqual(["magistral-medium-latest", "mistral-small-latest"]);
    expect(pickDefaultModel("mistral", ["magistral-medium-latest", "mistral-small-latest"])).toBe("mistral-small-latest");
    expect(pickDefaultModel("openrouter", ["openai/gpt-5", "google/gemma-3-27b-it:free", "deepseek/deepseek-chat-v3-0324:free"])).toBe("deepseek/deepseek-chat-v3-0324:free");
    expect(pickDefaultModel("openrouter", ["x/y:free"])).toBe("x/y:free");
  });
});

describe("free OpenRouter models under load (ADR-032)", () => {
  const ok = { choices: [{ message: { tool_calls: [{ function: { name: "emit_x", arguments: '{"a":1}' } }] }, finish_reason: "stop" }] };
  const busy = { error: { code: 429, message: "deepseek/deepseek-chat-v3-0324:free is temporarily rate-limited upstream. Please retry shortly.", metadata: { provider_name: "Chutes" } } };
  const daily = { error: { code: 429, message: "Rate limit exceeded: free-models-per-day. Add 10 credits to unlock 1000 free model requests per day" } };
  const tool = { name: "emit_x", description: "d", input_schema: { type: "object", properties: {} } };
  const run = () => compatStructured("openrouter", "sk-or-v1-x", {}, { model: "deepseek/deepseek-chat-v3-0324:free", system: "s", prompt: "p", tool, maxTokens: 900 });
  afterEach(() => {
    retryPolicy.rateScale = 1;
  });
  it("a free model falls back to the free router; paid models are sent alone", () => {
    expect(openRouterModels("deepseek/deepseek-chat-v3-0324:free")).toEqual(["deepseek/deepseek-chat-v3-0324:free", "openrouter/free"]);
    expect(openRouterModels("openai/gpt-5")).toEqual(["openai/gpt-5"]);
    expect(openRouterModels("openrouter/free")).toEqual(["openrouter/free"]);
  });
  it("sends the fallback list and backs off on an upstream 429 without a hint", async () => {
    retryPolicy.rateScale = 0;
    const f = mockReplies([200, { data: {} }], [429, busy], [200, ok]);
    expect(await run()).toEqual({ a: 1 });
    expect(bodyOf(f, 1).models).toEqual(["deepseek/deepseek-chat-v3-0324:free", "openrouter/free"]);
    expect(f).toHaveBeenCalledTimes(3);
  });
  it("a daily cap is not waited out and is recognised as daily", async () => {
    retryPolicy.rateScale = 0;
    const f = mockReplies([200, { data: {} }], [429, daily]);
    expect(isDailyLimit(daily)).toBe(true);
    expect(isDailyLimit(busy)).toBe(false);
    await expect(run()).rejects.toMatchObject({ kind: "rate", status: 429, provider: "openrouter" });
    expect(f).toHaveBeenCalledTimes(2);
  });
});
