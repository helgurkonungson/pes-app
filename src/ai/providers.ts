/**
 * AI providers the learner can bring a key for. Claude uses the Anthropic
 * Messages API; every other provider — ChatGPT, Gemini, Alice AI (Yandex AI
 * Studio), Qwen (DashScope), Groq, NVIDIA, Mistral, OpenRouter and any custom/local OpenAI-compatible
 * server (Ollama, LM Studio…) — uses OpenAI-compatible Chat Completions.
 */
import type { Profile, ProviderId } from "../core/types";

export interface ProviderMeta {
  id: ProviderId;
  name: string;
  keyUrl: string;
  keyPlaceholder: string;
  /** Model used until the learner picks one. */
  defaultModel: string;
  /** Fixed model list when the API can't list models. */
  models?: { id: string; name: string }[];
  /** Server-side web search for "Use the internet" — Claude only for now. */
  webSearch: boolean;
  /** Can force a specific function via tool_choice (else: "auto" + JSON fallback). */
  forceTool?: boolean;
  /** The key may be empty (local servers). */
  keyOptional?: boolean;
  /** One-line description in the provider picker (English; the UI translates by id). */
  vendor: string;
}

export const PROVIDERS: Record<ProviderId, ProviderMeta> = {
  anthropic: {
    id: "anthropic",
    name: "Claude",
    keyUrl: "https://console.anthropic.com/settings/keys",
    keyPlaceholder: "sk-ant-…",
    defaultModel: "claude-sonnet-5-5",
    webSearch: true,
    vendor: "Anthropic",
  },
  openai: {
    id: "openai",
    name: "ChatGPT",
    keyUrl: "https://platform.openai.com/api-keys",
    keyPlaceholder: "sk-…",
    defaultModel: "", // picked from /v1/models after the key is verified
    webSearch: false,
    forceTool: true,
    vendor: "OpenAI",
  },
  gemini: {
    id: "gemini",
    name: "Gemini",
    keyUrl: "https://aistudio.google.com/apikey",
    keyPlaceholder: "AIza…",
    defaultModel: "gemini-flash-latest", // replaced by the newest Flash model from the list after the key is verified
    webSearch: false,
    vendor: "Google AI Studio",
  },
  yandex: {
    id: "yandex",
    name: "Алиса AI",
    keyUrl: "https://aistudio.yandex.ru",
    keyPlaceholder: "AQVN…",
    defaultModel: "aliceai-llm",
    models: [
      { id: "aliceai-llm", name: "Alice AI LLM" },
      { id: "aliceai-llm-flash", name: "Alice AI LLM Flash" },
      { id: "yandexgpt-5.1", name: "YandexGPT Pro 5.1" },
      { id: "yandexgpt-5-lite", name: "YandexGPT Lite 5" },
      { id: "deepseek-v4.1-flash", name: "DeepSeek V4.1 Flash" },
      { id: "qwen3.6-35b-a3b", name: "Qwen3.6 35B" },
    ],
    webSearch: false,
    vendor: "Yandex AI Studio",
  },
  nvidia: {
    id: "nvidia",
    name: "NVIDIA",
    keyUrl: "https://build.nvidia.com",
    keyPlaceholder: "nvapi-…",
    defaultModel: "meta/llama-3.3-70b-instruct",
    webSearch: false,
    vendor: "build.nvidia.com",
  },
  groq: {
    id: "groq",
    name: "Groq",
    keyUrl: "https://console.groq.com/keys",
    keyPlaceholder: "gsk_…",
    defaultModel: "llama-3.3-70b-versatile",
    webSearch: false,
    forceTool: true,
    vendor: "GroqCloud",
  },
  mistral: {
    id: "mistral",
    name: "Mistral",
    keyUrl: "https://console.mistral.ai/api-keys",
    keyPlaceholder: "…",
    defaultModel: "mistral-small-latest",
    webSearch: false,
    vendor: "Mistral AI",
  },
  openrouter: {
    id: "openrouter",
    name: "OpenRouter",
    keyUrl: "https://openrouter.ai/settings/keys",
    keyPlaceholder: "sk-or-…",
    defaultModel: "", // a free model is picked from the list after the key is verified
    webSearch: false,
    vendor: "OpenRouter",
  },
  custom: {
    id: "custom",
    name: "Custom API",
    keyUrl: "https://ollama.com",
    keyPlaceholder: "optional",
    defaultModel: "",
    webSearch: false,
    keyOptional: true,
    vendor: "Ollama, LM Studio, vLLM…",
  },
  qwen: {
    id: "qwen",
    name: "Qwen",
    keyUrl: "https://modelstudio.console.alibabacloud.com",
    keyPlaceholder: "sk-…",
    defaultModel: "qwen-plus",
    webSearch: false,
    forceTool: true,
    vendor: "Alibaba DashScope",
  },
};

export const PROVIDER_IDS: ProviderId[] = ["anthropic", "openai", "gemini", "groq", "mistral", "openrouter", "yandex", "qwen", "nvidia", "custom"];

export function activeProvider(p: Pick<Profile, "provider"> | undefined): ProviderId {
  return p?.provider && PROVIDERS[p.provider] ? p.provider : "anthropic";
}

/** Model id for the active provider. */
export function modelOf(p: Pick<Profile, "provider" | "model" | "providerModels">): string {
  const id = activeProvider(p);
  if (id === "anthropic") return p.model || PROVIDERS.anthropic.defaultModel;
  return p.providerModels?.[id] || PROVIDERS[id].defaultModel;
}

/** Normalizes a user-typed server address: adds http:// when missing, drops trailing slashes and "/chat/completions". */
export function normalizeBaseUrl(raw: string | undefined): string {
  let u = (raw ?? "").trim();
  if (!u) return "";
  if (!/^https?:\/\//i.test(u)) u = `http://${u}`;
  return u.replace(/\/+$/, "").replace(/\/chat\/completions$/i, "");
}

/** Base URL of the OpenAI-compatible endpoint. */
export function baseUrl(id: ProviderId, p: Pick<Profile, "qwenRegion" | "customBaseUrl">): string {
  switch (id) {
    case "gemini":
      return "https://generativelanguage.googleapis.com/v1beta/openai";
    case "groq":
      return "https://api.groq.com/openai/v1";
    case "mistral":
      return "https://api.mistral.ai/v1";
    case "openrouter":
      return "https://openrouter.ai/api/v1";
    case "custom":
      return normalizeBaseUrl(p.customBaseUrl);
    case "openai":
      return "https://api.openai.com/v1";
    case "yandex":
      return "https://llm.api.cloud.yandex.net/v1";
    case "nvidia":
      return "https://integrate.api.nvidia.com/v1";
    case "qwen":
      return p.qwenRegion === "cn" ? "https://dashscope.aliyuncs.com/compatible-mode/v1" : "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
    default:
      return "https://api.anthropic.com/v1";
  }
}

/** Yandex wants full model URIs: gpt://<folder>/<model>. */
export function wireModel(id: ProviderId, model: string, p: Pick<Profile, "yandexFolder">): string {
  if (id === "yandex" && !model.startsWith("gpt://")) return `gpt://${(p.yandexFolder ?? "").trim()}/${model}`;
  return model;
}

/** OpenAI's list includes embeddings, audio, images… keep chat models only. */
export function isChatModel(id: string): boolean {
  return /^(gpt-|o\d|chatgpt-)/i.test(id) && !/(embedding|audio|tts|transcribe|realtime|image|search|moderation|instruct|dall-e|whisper)/i.test(id);
}

/** NVIDIA's catalog mixes chat LLMs with embedding, reranking, speech and image models. */
export function isNvidiaChatModel(id: string): boolean {
  return /(instruct|chat|nemotron|llama|qwen|deepseek|mistral|mixtral|gemma|phi|kimi|glm|gpt-oss)/i.test(id) && !/(embed|rerank|retriever|guard|safety|reward|vision|vlm|clip|parse|ocr|tts|asr|whisper|riva|image|flux|sdxl|stable-diffusion|base$)/i.test(id);
}

/** Gemini's list also has embedding, image, TTS and AQA models; ids may come as "models/…". */
export function isGeminiChatModel(id: string): boolean {
  return /gemini/i.test(id) && !/(embedding|image|imagen|tts|audio|live|aqa|veo|robotics|computer-use)/i.test(id);
}

export function isMistralChatModel(id: string): boolean {
  return /(mistral|magistral|ministral|pixtral|codestral|devstral)/i.test(id) && !/(embed|moderation|ocr|transcribe|voxtral)/i.test(id);
}

export function isGroqChatModel(id: string): boolean {
  return !/(whisper|guard|tts|playai|orpheus|prompt-guard|safeguard)/i.test(id);
}

/** Keeps models that can write lessons, per provider. */
export function chatModels(id: ProviderId, ids: string[]): string[] {
  const clean = ids.map((m) => m.replace(/^models\//, ""));
  const keep = (m: string) => {
    switch (id) {
      case "openai":
        return isChatModel(m);
      case "nvidia":
        return isNvidiaChatModel(m);
      case "qwen":
        return /^qwen/i.test(m);
      case "gemini":
        return isGeminiChatModel(m);
      case "groq":
        return isGroqChatModel(m);
      case "mistral":
        return isMistralChatModel(m);
      case "openrouter":
        return !/(embed|image|audio|tts|whisper|moderation|guard)/i.test(m);
      default:
        return true;
    }
  };
  return [...new Set(clean.filter(keep))].sort();
}

/** Model to select automatically after a key is verified (empty = keep the default). */
export function pickDefaultModel(id: ProviderId, ids: string[]): string {
  const list = chatModels(id, ids);
  if (id === "openai") return pickOpenAiModel(list);
  if (id === "gemini") {
    // newest stable Flash: highest version number, not lite/preview/experimental
    const flash = list.filter((m) => /^gemini-[\d.]+-flash$/.test(m));
    const ver = (m: string) => parseFloat(m.split("-")[1] ?? "0");
    return flash.sort((a, b) => ver(b) - ver(a))[0] ?? (list.includes("gemini-flash-latest") ? "gemini-flash-latest" : "");
  }
  if (id === "groq") return ["openai/gpt-oss-120b", "llama-3.3-70b-versatile"].find((m) => list.includes(m)) ?? "";
  if (id === "mistral") return ["mistral-small-latest", "mistral-medium-latest"].find((m) => list.includes(m)) ?? "";
  if (id === "openrouter") return pickOpenRouterModel(list);
  if (id === "custom") return list[0] ?? "";
  return "";
}

/** Best default among listed OpenAI models: newest gpt "mini" class first (cheap, good enough for lessons). */
export function pickOpenAiModel(ids: string[]): string {
  const chat = ids.filter(isChatModel).sort().reverse();
  return chat.find((m) => /^gpt-\d+(\.\d+)?-mini$/.test(m)) ?? chat.find((m) => /^gpt-\d/.test(m)) ?? chat[0] ?? "";
}

/**
 * What to send as OpenRouter's `models` list: a free model gets the free-models router as a
 * fallback, so a busy or retired free model doesn't fail the lesson (ADR-032).
 */
export function openRouterModels(model: string): string[] {
  if (!model.endsWith(":free") || model.startsWith("openrouter/")) return [model];
  return [model, "openrouter/free"];
}

/** OpenRouter: a free model (":free") from a known strong family, else any free one. */
export function pickOpenRouterModel(ids: string[]): string {
  const free = ids.filter((m) => m.endsWith(":free"));
  const prefer = [/deepseek\/deepseek-(chat|v3)/, /meta-llama\/llama-[34][\d.]*-\d+b-instruct/, /qwen\/qwen[\d.]*-\d+b/, /google\/gemma/, /mistralai\//];
  for (const re of prefer) {
    const hit = free.find((m) => re.test(m));
    if (hit) return hit;
  }
  return free[0] ?? ids[0] ?? "";
}
