/**
 * OpenAI-compatible Chat Completions client for ChatGPT, Alice AI (Yandex AI
 * Studio) and Qwen (DashScope). On the phone requests go through Capacitor's
 * native HTTP, so provider CORS rules don't matter.
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

function errorMessage(data: unknown, status: number): string {
  const d = data as { error?: { message?: string; code?: string } | string; message?: string; code?: string } | null;
  if (typeof d?.error === "string") return d.error;
  return [d?.error?.message ?? d?.message, d?.error?.code ?? d?.code].filter(Boolean).join(" ") || String(status);
}

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
  else body.max_tokens = Math.min(opts.maxTokens, 16000);
  const url = `${baseUrl(id, cfg)}/chat/completions`;
  const send = () => http(url, { method: "POST", headers: headers(id, key, cfg), body, signal: opts.signal, timeoutMs: id === "custom" ? 600_000 : undefined });
  let r = await send();
  // a server that rejects the forced function (or tools at all) gets a second, plainer try
  if (r.status === 400 && /tool/i.test(errorMessage(r.data, r.status))) {
    if (typeof body.tool_choice === "object") body.tool_choice = "auto";
    else {
      delete body.tools;
      delete body.tool_choice;
    }
    r = await send();
  }
  check(id, r);
  const choice = (r.data as { choices?: { message?: { content?: string | null; tool_calls?: { function?: { name?: string; arguments?: string } }[] }; finish_reason?: string }[] })?.choices?.[0];
  const call = choice?.message?.tool_calls?.find((c) => c.function?.name === opts.tool.name) ?? choice?.message?.tool_calls?.[0];
  if (call?.function?.arguments) {
    try {
      return JSON.parse(call.function.arguments) as T;
    } catch {
      if (choice?.finish_reason === "length") throw new AiError("The lesson was too long for one answer.", "bad-response");
      throw new AiError("The AI returned broken JSON.", "bad-response");
    }
  }
  if (choice?.message?.content) return extractJson(choice.message.content) as T;
  throw new AiError("The AI answered in an unexpected format.", "bad-response");
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
