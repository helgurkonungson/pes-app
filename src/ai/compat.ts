/**
 * OpenAI-compatible Chat Completions client for every provider except Claude
 * (ChatGPT, Gemini, Alice AI, Qwen, Groq, NVIDIA, custom servers). On the phone
 * requests go through Capacitor's native HTTP, so provider CORS rules don't matter.
 */
import { Capacitor, CapacitorHttp } from "@capacitor/core";
import { classifyApiError } from "../core/aiStatus";
import type { Profile, ProviderId } from "../core/types";
import { AiError, type ModelInfo, type ToolDef } from "./client";
import { baseUrl, chatModels, PROVIDERS, wireModel } from "./providers";

type Cfg = Pick<Profile, "yandexFolder" | "qwenRegion" | "customBaseUrl">;

interface HttpResult {
  status: number;
  data: unknown;
}

async function http(url: string, opts: { method: "GET" | "POST"; headers: Record<string, string>; body?: unknown; signal?: AbortSignal; timeoutMs?: number }): Promise<HttpResult> {
  const timeoutMs = opts.timeoutMs ?? 240_000;
  if (opts.signal?.aborted) throw new AiError("Cancelled.", "aborted");
  if (Capacitor.isNativePlatform()) {
    const req = CapacitorHttp.request({ url, method: opts.method, headers: opts.headers, data: opts.body, connectTimeout: 30_000, readTimeout: timeoutMs, responseType: "json" });
    const aborted = new Promise<never>((_, rej) => opts.signal?.addEventListener("abort", () => rej(new AiError("Cancelled.", "aborted"))));
    try {
      const r = await Promise.race([req, aborted]);
      return { status: r.status, data: r.data };
    } catch (e) {
      if (e instanceof AiError) throw e;
      throw new AiError(`No connection: ${String(e)}`, "network");
    }
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const onAbort = () => ctrl.abort();
  opts.signal?.addEventListener("abort", onAbort);
  try {
    const res = await fetch(url, { method: opts.method, headers: opts.headers, body: opts.body === undefined ? undefined : JSON.stringify(opts.body), signal: ctrl.signal });
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      /* empty body */
    }
    return { status: res.status, data };
  } catch {
    if (opts.signal?.aborted) throw new AiError("Cancelled.", "aborted");
    if (ctrl.signal.aborted) throw new AiError("The AI took too long to answer.", "network");
    throw new AiError("No connection to the AI service.", "network");
  } finally {
    clearTimeout(timer);
    opts.signal?.removeEventListener("abort", onAbort);
  }
}

function headers(id: ProviderId, key: string, cfg: Cfg): Record<string, string> {
  const h: Record<string, string> = { "content-type": "application/json" };
  if (key) h.authorization = `Bearer ${key}`; // local servers usually need no key
  if (id === "yandex" && cfg.yandexFolder) h["OpenAI-Project"] = cfg.yandexFolder.trim();
  return h;
}

type ErrBody = { error?: { message?: string; code?: string | number; status?: string } | string; message?: string; code?: string | number } | null;

function errorMessage(data: unknown, status: number): string {
  // Gemini's OpenAI-compatible endpoint wraps errors in an array: [{ error: { code: 503, message, status: "UNAVAILABLE" } }]
  const d = (Array.isArray(data) ? data[0] : data) as ErrBody;
  if (typeof d?.error === "string") return d.error;
  const e = d?.error;
  const code = typeof e?.code === "string" ? e.code : (e?.status ?? (typeof d?.code === "string" ? d.code : undefined));
  return [e?.message ?? d?.message, code].filter(Boolean).join(" ") || String(status);
}

/** Server-side failures worth re-sending as is (Gemini "model is overloaded" 503, transient 500s). */
const transient = (status: number) => status === 500 || status === 502 || status === 503 || status === 529;

/** Pauses before each re-send of a transient failure. Tests set it to [0, 0]. */
export const retryPolicy = { delaysMs: [2_000, 5_000], rateWaits: 2, maxRateWaitMs: 65_000, rateScale: 1 };

/**
 * How long a 429 asks us to wait ("retry in 41.2s", Google's RetryInfo "retryDelay": "41s"),
 * or null when it is not a short per-minute limit (a daily quota, no hint, or too long).
 */
export function rateLimitWaitMs(data: unknown): number | null {
  const text = JSON.stringify(data ?? "");
  if (/per ?day|PerDay|daily/i.test(text)) return null;
  const m = text.match(/retry (?:in|after) ([\d.]+) ?s/i) ?? text.match(/retryDelay\\?":\s*\\?"([\d.]+)s/i);
  if (!m) return null;
  const ms = Math.ceil(parseFloat(m[1]) * 1000) + 1000;
  if (!Number.isFinite(ms) || ms > retryPolicy.maxRateWaitMs) return null;
  return Math.round(ms * retryPolicy.rateScale);
}

function pause(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.reject(new AiError("Cancelled.", "aborted"));
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer);
      reject(new AiError("Cancelled.", "aborted"));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/** Gemini 2.5+ "think" before answering; thinking tokens count against max_tokens and slow the answer. */
export function isGeminiThinking(model: string): boolean {
  return /gemini/i.test(model) && !/gemini-(1\.|2\.0)/i.test(model);
}

/** Extra output budget for Gemini's (reduced) thinking. */
export const GEMINI_THINKING_TOKENS = 4096;

function check(id: ProviderId, r: HttpResult): void {
  if (r.status >= 200 && r.status < 300) return;
  const msg = errorMessage(r.data, r.status);
  throw new AiError(`${PROVIDERS[id].name} request failed (${r.status}): ${msg}`, classifyApiError(r.status, msg), r.status, msg, id);
}

/** Pulls a JSON object out of a model's text answer (fallback when it doesn't call the tool). */
export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const src = fenced ? fenced[1] : text;
  const start = src.indexOf("{");
  const end = src.lastIndexOf("}");
  if (start < 0 || end <= start) throw new AiError("No JSON in the answer.", "bad-response");
  try {
    return JSON.parse(src.slice(start, end + 1));
  } catch {
    throw new AiError("The AI answered with broken JSON.", "bad-response");
  }
}

export async function compatStructured<T>(
  id: ProviderId,
  key: string,
  cfg: Cfg,
  opts: { model: string; system: string; prompt: string; tool: ToolDef; maxTokens: number; signal?: AbortSignal },
): Promise<T> {
  if (id === "yandex" && !cfg.yandexFolder?.trim()) throw new AiError("Yandex folder id is missing.", "auth");
  if (id === "custom" && !baseUrl(id, cfg)) throw new AiError("Custom server address is missing.", "no-key");
  if (!opts.model) throw new AiError("No model selected.", "no-key");
  // providers that can't force a function (Yandex: only auto/none; many NVIDIA, Gemini and local
  // models) are asked in words, and JSON in the text answer is accepted as a fallback
  const body: Record<string, unknown> = {
    model: wireModel(id, opts.model, cfg),
    messages: [
      { role: "system", content: `${opts.system}\nAlways return the result by calling the function ${opts.tool.name}. If you cannot call functions, reply with only a JSON object matching its parameters.` },
      { role: "user", content: opts.prompt },
    ],
    tools: [{ type: "function", function: { name: opts.tool.name, description: opts.tool.description, parameters: opts.tool.input_schema } }],
    tool_choice: PROVIDERS[id].forceTool ? { type: "function", function: { name: opts.tool.name } } : "auto",
  };
  // newer OpenAI models reject max_tokens; compatible APIs expect it
  if (id === "openai") body.max_completion_tokens = opts.maxTokens;
  else if (id === "gemini") body.max_tokens = Math.min(opts.maxTokens + GEMINI_THINKING_TOKENS, 32_000);
  else body.max_tokens = Math.min(opts.maxTokens, 16000);
  // Gemini thinks at full depth by default: slow, token-hungry, and long requests end in 5xx/timeouts
  if (id === "gemini" && isGeminiThinking(opts.model)) body.reasoning_effort = "low";
  const url = `${baseUrl(id, cfg)}/chat/completions`;
  const post = () => http(url, { method: "POST", headers: headers(id, key, cfg), body, signal: opts.signal, timeoutMs: id === "custom" ? 600_000 : undefined });
  const send = async () => {
    let res = await post();
    for (const ms of retryPolicy.delaysMs) {
      if (!transient(res.status)) break;
      await pause(ms, opts.signal);
      res = await post();
    }
    // per-minute limits (Gemini free tier: "Please retry in 41s"): wait it out, a lesson takes several requests
    for (let i = 0; i < retryPolicy.rateWaits && res.status === 429; i++) {
      const wait = rateLimitWaitMs(res.data);
      if (wait === null) break;
      await pause(wait, opts.signal);
      res = await post();
    }
    return res;
  };
  let r = await send();
  // when the request itself is the problem, step down to plainer requests (each step at most once):
  // drop reasoning_effort if refused → stop forcing the function → no tools at all, JSON in the text
  for (let step = 0; step < 3 && (r.status < 200 || r.status >= 300); step++) {
    const msg = errorMessage(r.data, r.status);
    if (r.status === 400 && "reasoning_effort" in body && /reasoning|thinking/i.test(msg)) delete body.reasoning_effort;
    else if (r.status === 400 && /tool|function/i.test(msg) && typeof body.tool_choice === "object") body.tool_choice = "auto";
    else if (body.tools && ((r.status === 400 && /tool|function/i.test(msg)) || r.status >= 500)) asPlainJson(body, opts.system, opts.tool);
    else break;
    r = await send();
  }
  check(id, r);
  const choice = (r.data as { choices?: { message?: { content?: string | null; tool_calls?: { function?: { name?: string; arguments?: string } }[] }; finish_reason?: string }[] })?.choices?.[0];
  const call = choice?.message?.tool_calls?.find((c) => c.function?.name === opts.tool.name) ?? choice?.message?.tool_calls?.[0];
  // finish_reason ("length" = ran out of tokens, "stop", "content_filter"…) explains most format failures
  const why = choice?.finish_reason ? `finish_reason: ${choice.finish_reason}` : undefined;
  const bad = (message: string) => new AiError(message, "bad-response", r.status, why, id);
  if (call?.function?.arguments) {
    try {
      return JSON.parse(call.function.arguments) as T;
    } catch {
      throw bad(choice?.finish_reason === "length" ? "The lesson was too long for one answer." : "The AI returned broken JSON.");
    }
  }
  if (choice?.message?.content) {
    try {
      return extractJson(choice.message.content) as T;
    } catch (e) {
      throw bad((e as Error).message);
    }
  }
  throw bad("The AI answered in an unexpected format.");
}

/** Turns a function-calling request into "answer with JSON matching this schema" (the model still needs the schema). */
function asPlainJson(body: Record<string, unknown>, system: string, tool: ToolDef): void {
  delete body.tools;
  delete body.tool_choice;
  const messages = body.messages as { role: string; content: string }[];
  messages[0] = {
    role: "system",
    content: `${system}\nReply with only one JSON object (no other text) that matches this JSON Schema — it is the result of "${tool.name}" (${tool.description}):\n${JSON.stringify(tool.input_schema)}`,
  };
}

export async function compatListModels(id: ProviderId, key: string, cfg: Cfg): Promise<ModelInfo[]> {
  const fixed = PROVIDERS[id].models;
  if (fixed) {
    // Yandex has no reliable model list: verify the key with a tiny request instead
    const r = await http(`${baseUrl(id, cfg)}/chat/completions`, {
      method: "POST",
      headers: headers(id, key, cfg),
      body: { model: wireModel(id, PROVIDERS[id].defaultModel, cfg), messages: [{ role: "user", content: "ping" }], max_tokens: 1 },
      timeoutMs: 30_000,
    });
    check(id, r);
    return fixed.map((m) => ({ id: m.id, display_name: m.name }));
  }
  if (id === "custom" && !baseUrl(id, cfg)) throw new AiError("Custom server address is missing.", "no-key");
  const r = await http(`${baseUrl(id, cfg)}/models`, { method: "GET", headers: headers(id, key, cfg), timeoutMs: 20_000 });
  check(id, r);
  const list = ((r.data as { data?: { id: string }[]; models?: { name?: string; model?: string }[] })?.data ?? []).map((m) => m.id);
  return chatModels(id, list).map((m) => ({ id: m, display_name: m }));
}
