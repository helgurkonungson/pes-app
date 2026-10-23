/**
 * AI providers the learner can bring a key for. Claude uses the Anthropic
 * Messages API; ChatGPT, Alice AI (Yandex AI Studio), NVIDIA (build.nvidia.com) and Qwen (Alibaba
 * DashScope) use OpenAI-compatible Chat Completions.
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
}

export const PROVIDERS: Record<ProviderId, ProviderMeta> = {
  anthropic: {
    id: "anthropic",
    name: "Claude",
    keyUrl: "https://console.anthropic.com/settings/keys",
    keyPlaceholder: "sk-ant-…",
    defaultModel: "claude-sonnet-5-5",
    webSearch: true,
  },
  openai: {
    id: "openai",
    name: "ChatGPT",
    keyUrl: "https://platform.openai.com/api-keys",
    keyPlaceholder: "sk-…",
    defaultModel: "", // picked from /v1/models after the key is verified
    webSearch: false,
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
  },
  nvidia: {
    id: "nvidia",
    name: "NVIDIA",
    keyUrl: "https://build.nvidia.com",
    keyPlaceholder: "nvapi-…",
    defaultModel: "meta/llama-3.3-70b-instruct",
    webSearch: false,
  },
  qwen: {
    id: "qwen",
    name: "Qwen",
    keyUrl: "https://modelstudio.console.alibabacloud.com",
    keyPlaceholder: "sk-…",
    defaultModel: "qwen-plus",
    webSearch: false,
  },
};

export const PROVIDER_IDS: ProviderId[] = ["anthropic", "openai", "yandex", "qwen", "nvidia"];

export function activeProvider(p: Pick<Profile, "provider"> | undefined): ProviderId {
  return p?.provider && PROVIDERS[p.provider] ? p.provider : "anthropic";
}

/** Model id for the active provider. */
export function modelOf(p: Pick<Profile, "provider" | "model" | "providerModels">): string {
  const id = activeProvider(p);
  if (id === "anthropic") return p.model || PROVIDERS.anthropic.defaultModel;
  return p.providerModels?.[id] || PROVIDERS[id].defaultModel;
}

/** Base URL of the OpenAI-compatible endpoint. */
export function baseUrl(id: ProviderId, p: Pick<Profile, "qwenRegion">): string {
  switch (id) {
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

/** Best default among listed OpenAI models: newest gpt "mini" class first (cheap, good enough for lessons). */
export function pickOpenAiModel(ids: string[]): string {
  const chat = ids.filter(isChatModel).sort().reverse();
  return chat.find((m) => /^gpt-\d+(\.\d+)?-mini$/.test(m)) ?? chat.find((m) => /^gpt-\d/.test(m)) ?? chat[0] ?? "";
}
