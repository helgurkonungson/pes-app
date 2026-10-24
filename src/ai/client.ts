/**
 * Minimal Claude Messages API client that runs on the device with the user's key.
 * Docs: https://platform.claude.com/docs — Messages API, tool use, web search tool.
 */
import { type AiErrorKind, classifyApiError } from "../core/aiStatus";
import { getProfile } from "../data/db";
import type { ProviderId, TokenUsage } from "../core/types";
import { recordMonthly } from "./usage";
import { compatListModels, compatStructured } from "./compat";
import { getApiKey } from "./key";
import { activeProvider, PROVIDERS } from "./providers";

const API = "https://api.anthropic.com/v1";
const VERSION = "2023-06-01";

/** AI failure. `message` is for logs (English); the UI shows a localized text by `kind`. */
export class AiError extends Error {
  constructor(
    message: string,
    public kind: AiErrorKind,
    public status?: number,
    /** The provider's own error text, shown to the learner as a detail. */
    public detail?: string,
    public provider?: ProviderId,
  ) {
    super(message);
  }
}

/** Counts a request's tokens for the lesson (callback) and the month (profile). */
export function noteUsage(u: TokenUsage, onUsage?: (u: TokenUsage) => void): void {
  onUsage?.(u);
  void recordMonthly(u);
}

export interface ToolDef {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

type ContentBlock =
  | { type: "text"; text: string; citations?: { type: string; url?: string; title?: string }[] }
  | { type: "tool_use"; id: string; name: string; input: unknown }
  | { type: string; [k: string]: unknown };

export interface MessageResponse {
  id: string;
  model: string;
  stop_reason: string;
  content: ContentBlock[];
  usage?: { input_tokens: number; output_tokens: number };
}

function headers(key: string): Record<string, string> {
  return {
    "content-type": "application/json",
    "x-api-key": key,
    "anthropic-version": VERSION,
    // required for calls made from a browser/WebView context
    "anthropic-dangerous-direct-browser-access": "true",
  };
}

async function request<T>(path: string, init: RequestInit & { key?: string; timeoutMs?: number } = {}): Promise<T> {
  const key = init.key ?? (await getApiKey("anthropic"));
  if (!key) throw new AiError("Add your Claude API key in Settings first.", "no-key");
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), init.timeoutMs ?? 240_000);
  const outer = init.signal;
  const onAbort = () => ctrl.abort();
  outer?.addEventListener("abort", onAbort);
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, { ...init, headers: headers(key), signal: ctrl.signal });
  } catch (e) {
    if (outer?.aborted) throw new AiError("Cancelled.", "aborted");
    if (ctrl.signal.aborted) throw new AiError("The AI took too long to answer. Try again.", "network");
    throw new AiError("No connection to the AI service. Check your internet.", "network");
  } finally {
    clearTimeout(timer);
    outer?.removeEventListener("abort", onAbort);
  }
  if (!res.ok) {
    let msg = `${res.status}`;
    try {
      const j = await res.json();
      msg = j?.error?.message ?? msg;
    } catch {
      /* ignore */
    }
    throw new AiError(`AI request failed (${res.status}): ${msg}`, classifyApiError(res.status, msg), res.status, msg, "anthropic");
  }
  return (await res.json()) as T;
}

export interface CreateParams {
  model: string;
  system: string;
  messages: { role: "user" | "assistant"; content: unknown }[];
  max_tokens: number;
  tools?: unknown[];
  tool_choice?: unknown;
  temperature?: number;
}

export function createMessage(params: CreateParams, signal?: AbortSignal): Promise<MessageResponse> {
  return request<MessageResponse>("/messages", { method: "POST", body: JSON.stringify(params), signal });
}

/** Forces a single tool call and returns its input — our way of getting reliable JSON. */
export async function structured<T>(opts: { model: string; system: string; prompt: string; tool: ToolDef; maxTokens: number; signal?: AbortSignal; onUsage?: (u: TokenUsage) => void }): Promise<T> {
  const profile = await getProfile();
  const provider = activeProvider(profile);
  if (provider !== "anthropic") {
    const key = await getApiKey(provider);
    if (!key && !PROVIDERS[provider].keyOptional) throw new AiError("No API key for the selected provider.", "no-key");
    return compatStructured<T>(provider, key ?? "", profile, opts);
  }
  const res = await createMessage(
    {
      model: opts.model,
      system: opts.system,
      max_tokens: opts.maxTokens,
      messages: [{ role: "user", content: opts.prompt }],
      tools: [opts.tool],
      tool_choice: { type: "tool", name: opts.tool.name },
    },
    opts.signal,
  );
  noteUsage({ input: res.usage?.input_tokens ?? 0, output: res.usage?.output_tokens ?? 0, requests: 1 }, opts.onUsage);
  const block = res.content.find((b): b is { type: "tool_use"; id: string; name: string; input: unknown } => b.type === "tool_use" && (b as { name?: string }).name === opts.tool.name);
  if (!block) {
    if (res.stop_reason === "max_tokens") throw new AiError("The lesson was too long for one answer. Try a shorter portion.", "bad-response");
    throw new AiError("The AI answered in an unexpected format. Try again.", "bad-response");
  }
  return block.input as T;
}

export interface ResearchNotes {
  text: string;
  links: { title: string; url: string }[];
}

/** Web research with the server-side web search tool. Returns plain notes plus cited links. */
export async function research(opts: { model: string; prompt: string; signal?: AbortSignal; maxSearches?: number; onUsage?: (u: TokenUsage) => void }): Promise<ResearchNotes> {
  const messages: CreateParams["messages"] = [{ role: "user", content: opts.prompt }];
  let text = "";
  const links = new Map<string, string>();
  for (let turn = 0; turn < 3; turn++) {
    const res = await createMessage(
      {
        model: opts.model,
        system: "You are a meticulous research assistant. Search the web, then write compact factual notes. Prefer authoritative and recent sources.",
        max_tokens: 2500,
        messages,
        tools: [{ type: "web_search_20250305", name: "web_search", max_uses: opts.maxSearches ?? 3 }],
      },
      opts.signal,
    );
    noteUsage({ input: res.usage?.input_tokens ?? 0, output: res.usage?.output_tokens ?? 0, requests: 1 }, opts.onUsage);
    for (const b of res.content) {
      if (b.type === "text") {
        const tb = b as { text: string; citations?: { url?: string; title?: string }[] };
        text += tb.text;
        for (const c of tb.citations ?? []) if (c.url) links.set(c.url, c.title ?? c.url);
      }
    }
    if (res.stop_reason !== "pause_turn") break;
    messages.push({ role: "assistant", content: res.content });
  }
  return { text: text.trim(), links: [...links].slice(0, 8).map(([url, title]) => ({ url, title })) };
}

export interface ModelInfo {
  id: string;
  display_name: string;
}

export async function listModels(key?: string, providerIn?: ProviderId): Promise<ModelInfo[]> {
  const profile = await getProfile();
  const provider = providerIn ?? activeProvider(profile);
  if (provider !== "anthropic") {
    const k = key ?? (await getApiKey(provider));
    if (!k && !PROVIDERS[provider].keyOptional) throw new AiError("No API key for the selected provider.", "no-key");
    return compatListModels(provider, k ?? "", profile);
  }
  const res = await request<{ data: ModelInfo[] }>("/models?limit=50", { method: "GET", key, timeoutMs: 20_000 });
  return res.data ?? [];
}

/** Cheap call used to validate a key (for Yandex the folder id must be saved first). */
export async function testKey(key: string, provider?: ProviderId): Promise<ModelInfo[]> {
  return listModels(key, provider);
}
